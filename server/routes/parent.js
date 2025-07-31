const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { dbHelpers } = require('../database');
const { verifyToken } = require('./auth');

const router = express.Router();

// Get parent dashboard data
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get kids
    const kids = await dbHelpers.all(
      'SELECT * FROM kids WHERE parent_id = ? ORDER BY name',
      [req.user.userId]
    );

    // Get recent tasks
    const recentTasks = await dbHelpers.all(
      `SELECT t.*, k.name as kid_name 
       FROM tasks t 
       LEFT JOIN kids k ON t.kid_id = k.id 
       WHERE t.parent_id = ? 
       ORDER BY t.created_at DESC 
       LIMIT 10`,
      [req.user.userId]
    );

    // Get task statistics
    const stats = await dbHelpers.get(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'completed' THEN points ELSE 0 END) as total_points_awarded
       FROM tasks 
       WHERE parent_id = ?`,
      [req.user.userId]
    );

    // Get total points across all kids
    const totalPoints = await dbHelpers.get(
      'SELECT SUM(points) as total FROM kids WHERE parent_id = ?',
      [req.user.userId]
    );

    res.json({
      kids,
      recentTasks,
      stats,
      totalPoints: totalPoints.total || 0
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Add a new kid
router.post('/kids', verifyToken, [
  body('name').trim().isLength({ min: 1, max: 50 }),
  body('pin').isLength({ min: 4, max: 4 }).isNumeric(),
  body('avatar').optional().trim()
], async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Only parents can add kids' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, pin, avatar = 'default' } = req.body;

    // Check if PIN is already in use by another kid in the family
    const existingPin = await dbHelpers.get(
      'SELECT id FROM kids WHERE parent_id = ? AND pin = ?',
      [req.user.userId, pin]
    );

    if (existingPin) {
      return res.status(400).json({ error: 'PIN already in use by another child' });
    }

    // Hash the PIN for security
    const pinHash = await bcrypt.hash(pin, 10);

    const result = await dbHelpers.run(
      'INSERT INTO kids (parent_id, name, pin, avatar) VALUES (?, ?, ?, ?)',
      [req.user.userId, name, pinHash, avatar]
    );

    // Get the created kid
    const kid = await dbHelpers.get(
      'SELECT id, name, avatar, points, level FROM kids WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      message: 'Kid added successfully',
      kid
    });

  } catch (error) {
    console.error('Add kid error:', error);
    res.status(500).json({ error: 'Failed to add kid' });
  }
});

// Get all kids for a parent
router.get('/kids', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const kids = await dbHelpers.all(
      'SELECT id, name, avatar, points, level, created_at FROM kids WHERE parent_id = ? ORDER BY name',
      [req.user.userId]
    );

    res.json({ kids });

  } catch (error) {
    console.error('Get kids error:', error);
    res.status(500).json({ error: 'Failed to get kids' });
  }
});

// Update a kid
router.put('/kids/:kidId', verifyToken, [
  body('name').optional().trim().isLength({ min: 1, max: 50 }),
  body('pin').optional().isLength({ min: 4, max: 4 }).isNumeric(),
  body('avatar').optional().trim(),
  body('points').optional().isInt({ min: 0 }),
  body('level').optional().isInt({ min: 1, max: 20 })
], async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Only parents can update kids' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { kidId } = req.params;
    const updateFields = req.body;

    // Verify kid belongs to parent
    const existingKid = await dbHelpers.get(
      'SELECT * FROM kids WHERE id = ? AND parent_id = ?',
      [kidId, req.user.userId]
    );

    if (!existingKid) {
      return res.status(404).json({ error: 'Kid not found' });
    }

    // If updating PIN, check if it's already in use
    if (updateFields.pin) {
      const existingPin = await dbHelpers.get(
        'SELECT id FROM kids WHERE parent_id = ? AND pin = ? AND id != ?',
        [req.user.userId, updateFields.pin, kidId]
      );

      if (existingPin) {
        return res.status(400).json({ error: 'PIN already in use by another child' });
      }

      // Hash the new PIN
      updateFields.pin = await bcrypt.hash(updateFields.pin, 10);
    }

    // Build update query
    const updateKeys = Object.keys(updateFields).filter(key => 
      ['name', 'pin', 'avatar', 'points', 'level'].includes(key)
    );

    if (updateKeys.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = updateKeys.map(key => `${key} = ?`).join(', ');
    const values = updateKeys.map(key => updateFields[key]);

    await dbHelpers.run(
      `UPDATE kids SET ${setClause} WHERE id = ?`,
      [...values, kidId]
    );

    // Get updated kid
    const updatedKid = await dbHelpers.get(
      'SELECT id, name, avatar, points, level FROM kids WHERE id = ?',
      [kidId]
    );

    res.json({
      message: 'Kid updated successfully',
      kid: updatedKid
    });

  } catch (error) {
    console.error('Update kid error:', error);
    res.status(500).json({ error: 'Failed to update kid' });
  }
});

// Delete a kid
router.delete('/kids/:kidId', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Only parents can delete kids' });
    }

    const { kidId } = req.params;

    // Verify kid belongs to parent
    const kid = await dbHelpers.get(
      'SELECT * FROM kids WHERE id = ? AND parent_id = ?',
      [kidId, req.user.userId]
    );

    if (!kid) {
      return res.status(404).json({ error: 'Kid not found' });
    }

    // Delete associated tasks and reward redemptions
    await dbHelpers.run('DELETE FROM tasks WHERE kid_id = ?', [kidId]);
    await dbHelpers.run('DELETE FROM reward_redemptions WHERE kid_id = ?', [kidId]);
    await dbHelpers.run('DELETE FROM kids WHERE id = ?', [kidId]);

    res.json({ message: 'Kid deleted successfully' });

  } catch (error) {
    console.error('Delete kid error:', error);
    res.status(500).json({ error: 'Failed to delete kid' });
  }
});

// Get kid details with tasks
router.get('/kids/:kidId', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { kidId } = req.params;

    // Get kid details
    const kid = await dbHelpers.get(
      'SELECT * FROM kids WHERE id = ? AND parent_id = ?',
      [kidId, req.user.userId]
    );

    if (!kid) {
      return res.status(404).json({ error: 'Kid not found' });
    }

    // Get kid's tasks
    const tasks = await dbHelpers.all(
      'SELECT * FROM tasks WHERE kid_id = ? ORDER BY created_at DESC',
      [kidId]
    );

    // Get task statistics for this kid
    const stats = await dbHelpers.get(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'completed' THEN points ELSE 0 END) as total_points_earned
       FROM tasks 
       WHERE kid_id = ?`,
      [kidId]
    );

    res.json({
      kid: {
        id: kid.id,
        name: kid.name,
        avatar: kid.avatar,
        points: kid.points,
        level: kid.level,
        created_at: kid.created_at
      },
      tasks,
      stats
    });

  } catch (error) {
    console.error('Get kid details error:', error);
    res.status(500).json({ error: 'Failed to get kid details' });
  }
});

// Reset kid's points
router.post('/kids/:kidId/reset-points', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Only parents can reset points' });
    }

    const { kidId } = req.params;

    // Verify kid belongs to parent
    const kid = await dbHelpers.get(
      'SELECT * FROM kids WHERE id = ? AND parent_id = ?',
      [kidId, req.user.userId]
    );

    if (!kid) {
      return res.status(404).json({ error: 'Kid not found' });
    }

    // Reset points and level
    await dbHelpers.run(
      'UPDATE kids SET points = 0, level = 1 WHERE id = ?',
      [kidId]
    );

    res.json({ message: 'Points reset successfully' });

  } catch (error) {
    console.error('Reset points error:', error);
    res.status(500).json({ error: 'Failed to reset points' });
  }
});

module.exports = router; 