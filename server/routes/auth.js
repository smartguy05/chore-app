const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const { dbHelpers } = require('../database');
const { seedRewardsIfEmpty } = require('../utils/seedRewards');

const router = express.Router();

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Parent registration
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if parent already exists
    const existingParent = await dbHelpers.get(
      'SELECT id FROM parents WHERE email = ?',
      [email]
    );

    if (existingParent) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create parent account
    const result = await dbHelpers.run(
      'INSERT INTO parents (email, password_hash, name) VALUES (?, ?, ?)',
      [email, passwordHash, name]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.id, type: 'parent' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Seed default rewards for new parent (run in background)
    try {
      await seedRewardsIfEmpty(result.id);
    } catch (error) {
      console.error('Failed to seed rewards for new parent:', error);
      // Don't fail registration if reward seeding fails
    }

    res.status(201).json({
      message: 'Parent account created successfully',
      token,
      user: { id: result.id, email, name, type: 'parent' }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Parent login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find parent
    const parent = await dbHelpers.get(
      'SELECT * FROM parents WHERE email = ?',
      [email]
    );

    if (!parent) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, parent.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await dbHelpers.run(
      'UPDATE parents SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [parent.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: parent.id, type: 'parent' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: parent.id,
        email: parent.email,
        name: parent.name,
        type: 'parent'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Request magic link
router.post('/magic-link', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if parent exists
    const parent = await dbHelpers.get(
      'SELECT * FROM parents WHERE email = ?',
      [email]
    );

    if (!parent) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save token to database
    await dbHelpers.run(
      'INSERT INTO magic_links (email, token, expires_at) VALUES (?, ?, ?)',
      [email, token, expiresAt.toISOString()]
    );

    // Send email
    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/magic-link?token=${token}`;
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your Chore App Magic Link',
      html: `
        <h2>Welcome to Chore App!</h2>
        <p>Click the link below to log in to your account:</p>
        <a href="${magicLink}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Log In to Chore App
        </a>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this link, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Magic link sent to your email' });

  } catch (error) {
    console.error('Magic link error:', error);
    res.status(500).json({ error: 'Failed to send magic link' });
  }
});

// Verify magic link
router.post('/verify-magic-link', [
  body('token').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;

    // Find and validate token
    const magicLink = await dbHelpers.get(
      'SELECT * FROM magic_links WHERE token = ? AND used = 0 AND expires_at > CURRENT_TIMESTAMP',
      [token]
    );

    if (!magicLink) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Mark token as used
    await dbHelpers.run(
      'UPDATE magic_links SET used = 1 WHERE id = ?',
      [magicLink.id]
    );

    // Get parent details
    const parent = await dbHelpers.get(
      'SELECT * FROM parents WHERE email = ?',
      [magicLink.email]
    );

    // Update last login
    await dbHelpers.run(
      'UPDATE parents SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [parent.id]
    );

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: parent.id, type: 'parent' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Magic link verified successfully',
      token: jwtToken,
      user: {
        id: parent.id,
        email: parent.email,
        name: parent.name,
        type: 'parent'
      }
    });

  } catch (error) {
    console.error('Magic link verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Kid PIN login
router.post('/kid-login', [
  body('pin').isLength({ min: 4, max: 4 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pin } = req.body;

    // Find kid by PIN
    const kid = await dbHelpers.get(
      'SELECT k.*, p.name as parent_name FROM kids k JOIN parents p ON k.parent_id = p.id WHERE k.pin = ?',
      [pin]
    );

    if (!kid) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: kid.id, type: 'kid', parentId: kid.parent_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: kid.id,
        name: kid.name,
        avatar: kid.avatar,
        points: kid.points,
        level: kid.level,
        parentName: kid.parent_name,
        type: 'kid'
      }
    });

  } catch (error) {
    console.error('Kid login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    if (req.user.type === 'parent') {
      const parent = await dbHelpers.get(
        'SELECT id, email, name FROM parents WHERE id = ?',
        [req.user.userId]
      );
      
      if (!parent) {
        return res.status(404).json({ error: 'Parent not found' });
      }

      res.json({ ...parent, type: 'parent' });
    } else {
      const kid = await dbHelpers.get(
        'SELECT k.*, p.name as parent_name FROM kids k JOIN parents p ON k.parent_id = p.id WHERE k.id = ?',
        [req.user.userId]
      );

      if (!kid) {
        return res.status(404).json({ error: 'Kid not found' });
      }

      res.json({
        id: kid.id,
        name: kid.name,
        avatar: kid.avatar,
        points: kid.points,
        level: kid.level,
        parentName: kid.parent_name,
        type: 'kid'
      });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = { router, verifyToken }; 