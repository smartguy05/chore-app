const express = require('express');
const { dbHelpers } = require('../database');
const { verifyToken } = require('./auth');
const { getLevelProgress } = require('../utils/levelingSystem');

const router = express.Router();

// Get kid dashboard
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'kid') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get kid's current info
    const kid = await dbHelpers.get(
      'SELECT * FROM kids WHERE id = ?',
      [req.user.userId]
    );

    // Get pending tasks
    const pendingTasks = await dbHelpers.all(
      'SELECT * FROM tasks WHERE kid_id = ? AND status = "pending" ORDER BY due_date ASC, created_at DESC',
      [req.user.userId]
    );

    // Get recently completed tasks
    const completedTasks = await dbHelpers.all(
      'SELECT * FROM tasks WHERE kid_id = ? AND status = "completed" ORDER BY completed_at DESC LIMIT 5',
      [req.user.userId]
    );

    // Get task statistics
    const stats = await dbHelpers.get(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'completed' THEN points ELSE 0 END) as total_points_earned
       FROM tasks 
       WHERE kid_id = ?`,
      [req.user.userId]
    );

    // Calculate progress to next level using exponential system
    const levelProgress = getLevelProgress(kid.points);

    // Get available rewards
    const rewards = await dbHelpers.all(
      'SELECT * FROM rewards WHERE parent_id = ? AND is_active = 1 ORDER BY points_cost ASC',
      [req.user.parentId]
    );

    res.json({
      kid: {
        id: kid.id,
        name: kid.name,
        avatar: kid.avatar,
        points: kid.points,
        level: kid.level,
        parentName: kid.parent_name
      },
      pendingTasks,
      completedTasks,
      stats,
      levelProgress,
      rewards
    });

  } catch (error) {
    console.error('Get kid dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get kid's profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'kid') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const kid = await dbHelpers.get(
      'SELECT k.*, p.name as parent_name FROM kids k JOIN parents p ON k.parent_id = p.id WHERE k.id = ?',
      [req.user.userId]
    );

    if (!kid) {
      return res.status(404).json({ error: 'Kid not found' });
    }

    // Get achievement stats
    const achievements = await dbHelpers.get(
      `SELECT 
        COUNT(*) as total_tasks_completed,
        SUM(points) as total_points_earned,
        MAX(completed_at) as last_completion_date
       FROM tasks 
       WHERE kid_id = ? AND status = 'completed'`,
      [req.user.userId]
    );

    // Get streak information (consecutive days with completed tasks)
    const streakData = await dbHelpers.all(
      `SELECT DATE(completed_at) as completion_date
       FROM tasks 
       WHERE kid_id = ? AND status = 'completed'
       GROUP BY DATE(completed_at)
       ORDER BY completion_date DESC`,
      [req.user.userId]
    );

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    for (let i = 0; i < streakData.length; i++) {
      const date = streakData[i].completion_date;
      if (i === 0 && date === today) {
        currentStreak = 1;
      } else if (i === 0 && date === yesterday) {
        currentStreak = 1;
      } else if (i > 0) {
        const prevDate = new Date(streakData[i - 1].completion_date);
        const currDate = new Date(date);
        const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    res.json({
      kid: {
        id: kid.id,
        name: kid.name,
        avatar: kid.avatar,
        points: kid.points,
        level: kid.level,
        parentName: kid.parent_name,
        created_at: kid.created_at
      },
      achievements: {
        ...achievements,
        currentStreak,
        totalDaysActive: streakData.length
      }
    });

  } catch (error) {
    console.error('Get kid profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Get kid's task history
router.get('/tasks/history', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'kid') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get completed tasks with pagination
    const tasks = await dbHelpers.all(
      `SELECT * FROM tasks 
       WHERE kid_id = ? AND status = 'completed'
       ORDER BY completed_at DESC 
       LIMIT ? OFFSET ?`,
      [req.user.userId, limit, offset]
    );

    // Get total count
    const totalCount = await dbHelpers.get(
      'SELECT COUNT(*) as count FROM tasks WHERE kid_id = ? AND status = "completed"',
      [req.user.userId]
    );

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    });

  } catch (error) {
    console.error('Get task history error:', error);
    res.status(500).json({ error: 'Failed to get task history' });
  }
});

// Get kid's achievements and badges
router.get('/achievements', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'kid') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const kid = await dbHelpers.get(
      'SELECT points, level FROM kids WHERE id = ?',
      [req.user.userId]
    );

    // Get task statistics
    const stats = await dbHelpers.get(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'completed' THEN points ELSE 0 END) as total_points_earned,
        COUNT(DISTINCT DATE(completed_at)) as unique_days_with_tasks
       FROM tasks 
       WHERE kid_id = ?`,
      [req.user.userId]
    );

    // Define achievements
    const achievements = [
      {
        id: 'first_task',
        name: 'First Steps',
        description: 'Complete your first task',
        icon: '🌟',
        unlocked: stats.completed_tasks >= 1,
        progress: Math.min(stats.completed_tasks, 1),
        required: 1
      },
      {
        id: 'task_master',
        name: 'Task Master',
        description: 'Complete 10 tasks',
        icon: '🏆',
        unlocked: stats.completed_tasks >= 10,
        progress: Math.min(stats.completed_tasks, 10),
        required: 10
      },
      {
        id: 'point_collector',
        name: 'Point Collector',
        description: 'Earn 100 points',
        icon: '💎',
        unlocked: stats.total_points_earned >= 100,
        progress: Math.min(stats.total_points_earned, 100),
        required: 100
      },
      {
        id: 'level_up',
        name: 'Level Up!',
        description: 'Reach level 2',
        icon: '⭐',
        unlocked: kid.level >= 2,
        progress: Math.min(kid.level, 2),
        required: 2
      },
      {
        id: 'consistency',
        name: 'Consistency King',
        description: 'Complete tasks on 5 different days',
        icon: '📅',
        unlocked: stats.unique_days_with_tasks >= 5,
        progress: Math.min(stats.unique_days_with_tasks, 5),
        required: 5
      },
      {
        id: 'high_scorer',
        name: 'High Scorer',
        description: 'Earn 500 points',
        icon: '👑',
        unlocked: stats.total_points_earned >= 500,
        progress: Math.min(stats.total_points_earned, 500),
        required: 500
      }
    ];

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    res.json({
      achievements,
      stats: {
        totalAchievements: achievements.length,
        unlockedAchievements: unlockedCount,
        completionRate: Math.round((unlockedCount / achievements.length) * 100)
      }
    });

  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

module.exports = router; 