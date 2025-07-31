const express = require('express');
const { body, validationResult } = require('express-validator');
const { dbHelpers } = require('../database');
const { verifyToken } = require('./auth');

const router = express.Router();

// Create a new reward (parent only)
router.post('/', verifyToken, [
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('points_cost').isInt({ min: 1, max: 10000 })
], async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Only parents can create rewards' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, points_cost } = req.body;

    const result = await dbHelpers.run(
      'INSERT INTO rewards (parent_id, title, description, points_cost) VALUES (?, ?, ?, ?)',
      [req.user.userId, title, description || null, points_cost]
    );

    // Get the created reward
    const reward = await dbHelpers.get(
      'SELECT * FROM rewards WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      message: 'Reward created successfully',
      reward
    });

  } catch (error) {
    console.error('Create reward error:', error);
    res.status(500).json({ error: 'Failed to create reward' });
  }
});

// Get all rewards for a parent
router.get('/parent', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const rewards = await dbHelpers.all(
      'SELECT * FROM rewards WHERE parent_id = ? ORDER BY points_cost ASC',
      [req.user.userId]
    );

    res.json({ rewards });

  } catch (error) {
    console.error('Get parent rewards error:', error);
    res.status(500).json({ error: 'Failed to get rewards' });
  }
});

// Get available rewards for a kid
router.get('/kid', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'kid') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const rewards = await dbHelpers.all(
      'SELECT * FROM rewards WHERE parent_id = ? AND is_active = 1 ORDER BY points_cost ASC',
      [req.user.parentId]
    );

    // Get kid's current points
    const kid = await dbHelpers.get(
      'SELECT points FROM kids WHERE id = ?',
      [req.user.userId]
    );

    // Add affordability flag to each reward
    const rewardsWithAffordability = rewards.map(reward => ({
      ...reward,
      canAfford: kid.points >= reward.points_cost
    }));

    res.json({ 
      rewards: rewardsWithAffordability,
      currentPoints: kid.points
    });

  } catch (error) {
    console.error('Get kid rewards error:', error);
    res.status(500).json({ error: 'Failed to get rewards' });
  }
});

// Redeem a reward (kid only)
router.post('/:rewardId/redeem', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'kid') {
      return res.status(403).json({ error: 'Only kids can redeem rewards' });
    }

    const { rewardId } = req.params;

    // Get the reward
    const reward = await dbHelpers.get(
      'SELECT * FROM rewards WHERE id = ? AND parent_id = ? AND is_active = 1',
      [rewardId, req.user.parentId]
    );

    if (!reward) {
      return res.status(404).json({ error: 'Reward not found or inactive' });
    }

    // Get kid's current points
    const kid = await dbHelpers.get(
      'SELECT points FROM kids WHERE id = ?',
      [req.user.userId]
    );

    if (kid.points < reward.points_cost) {
      return res.status(400).json({ 
        error: 'Not enough points',
        required: reward.points_cost,
        available: kid.points
      });
    }

    // Deduct points and create redemption record
    await dbHelpers.run(
      'UPDATE kids SET points = points - ? WHERE id = ?',
      [reward.points_cost, req.user.userId]
    );

    await dbHelpers.run(
      'INSERT INTO reward_redemptions (kid_id, reward_id) VALUES (?, ?)',
      [req.user.userId, rewardId]
    );

    // Get updated kid info
    const updatedKid = await dbHelpers.get(
      'SELECT points FROM kids WHERE id = ?',
      [req.user.userId]
    );

    res.json({
      message: 'Reward redeemed successfully!',
      reward: {
        title: reward.title,
        description: reward.description,
        pointsCost: reward.points_cost
      },
      remainingPoints: updatedKid.points
    });

  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({ error: 'Failed to redeem reward' });
  }
});

// Update a reward (parent only)
router.put('/:rewardId', verifyToken, [
  body('title').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('points_cost').optional().isInt({ min: 1, max: 10000 }),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Only parents can update rewards' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rewardId } = req.params;
    const updateFields = req.body;

    // Verify reward belongs to parent
    const existingReward = await dbHelpers.get(
      'SELECT * FROM rewards WHERE id = ? AND parent_id = ?',
      [rewardId, req.user.userId]
    );

    if (!existingReward) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    // Build update query
    const updateKeys = Object.keys(updateFields).filter(key => 
      ['title', 'description', 'points_cost', 'is_active'].includes(key)
    );

    if (updateKeys.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = updateKeys.map(key => `${key} = ?`).join(', ');
    const values = updateKeys.map(key => updateFields[key]);

    await dbHelpers.run(
      `UPDATE rewards SET ${setClause} WHERE id = ?`,
      [...values, rewardId]
    );

    // Get updated reward
    const updatedReward = await dbHelpers.get(
      'SELECT * FROM rewards WHERE id = ?',
      [rewardId]
    );

    res.json({
      message: 'Reward updated successfully',
      reward: updatedReward
    });

  } catch (error) {
    console.error('Update reward error:', error);
    res.status(500).json({ error: 'Failed to update reward' });
  }
});

// Delete a reward (parent only)
router.delete('/:rewardId', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Only parents can delete rewards' });
    }

    const { rewardId } = req.params;

    // Verify reward belongs to parent
    const reward = await dbHelpers.get(
      'SELECT * FROM rewards WHERE id = ? AND parent_id = ?',
      [rewardId, req.user.userId]
    );

    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    // Delete associated redemptions first
    await dbHelpers.run('DELETE FROM reward_redemptions WHERE reward_id = ?', [rewardId]);
    
    // Delete the reward
    await dbHelpers.run('DELETE FROM rewards WHERE id = ?', [rewardId]);

    res.json({ message: 'Reward deleted successfully' });

  } catch (error) {
    console.error('Delete reward error:', error);
    res.status(500).json({ error: 'Failed to delete reward' });
  }
});

// Get redemption history (parent only)
router.get('/redemptions', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const redemptions = await dbHelpers.all(
      `SELECT rr.*, r.title as reward_title, r.points_cost, k.name as kid_name
       FROM reward_redemptions rr
       JOIN rewards r ON rr.reward_id = r.id
       JOIN kids k ON rr.kid_id = k.id
       WHERE r.parent_id = ?
       ORDER BY rr.redeemed_at DESC`,
      [req.user.userId]
    );

    res.json({ redemptions });

  } catch (error) {
    console.error('Get redemptions error:', error);
    res.status(500).json({ error: 'Failed to get redemption history' });
  }
});

// Get kid's redemption history
router.get('/kid/redemptions', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'kid') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const redemptions = await dbHelpers.all(
      `SELECT rr.*, r.title, r.description, r.points_cost
       FROM reward_redemptions rr
       JOIN rewards r ON rr.reward_id = r.id
       WHERE rr.kid_id = ?
       ORDER BY rr.redeemed_at DESC`,
      [req.user.userId]
    );

    res.json({ redemptions });

  } catch (error) {
    console.error('Get kid redemptions error:', error);
    res.status(500).json({ error: 'Failed to get redemption history' });
  }
});

// Get reward statistics for parent
router.get('/stats', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await dbHelpers.get(
      `SELECT 
        COUNT(*) as total_rewards,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_rewards,
        SUM(points_cost) as total_points_value
       FROM rewards 
       WHERE parent_id = ?`,
      [req.user.userId]
    );

    const redemptionStats = await dbHelpers.get(
      `SELECT 
        COUNT(*) as total_redemptions,
        SUM(r.points_cost) as total_points_redeemed
       FROM reward_redemptions rr
       JOIN rewards r ON rr.reward_id = r.id
       WHERE r.parent_id = ?`,
      [req.user.userId]
    );

    res.json({
      rewards: stats,
      redemptions: redemptionStats
    });

  } catch (error) {
    console.error('Get reward stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router; 