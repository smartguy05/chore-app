const express = require('express');
const { body, validationResult } = require('express-validator');
const { dbHelpers } = require('../database');
const { verifyToken } = require('./auth');

const router = express.Router();

// Helper function to generate recurring task instances
function generateRecurringTaskInstances(task, startDate, endDate) {
  const instances = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (!task.is_recurring || !task.recurring_type) {
    return instances;
  }

  const current = new Date(start);
  
  while (current <= end) {
    let shouldInclude = false;
    
    switch (task.recurring_type) {
      case 'daily':
        shouldInclude = true;
        break;
        
      case 'weekly':
        const recurringDays = JSON.parse(task.recurring_days || '[]');
        shouldInclude = recurringDays.includes(current.getDay());
        break;
        
      case 'monthly':
        const recurringMonthDays = JSON.parse(task.recurring_days || '[]');
        shouldInclude = recurringMonthDays.includes(current.getDate());
        break;
    }
    
    if (shouldInclude) {
      instances.push({
        ...task,
        due_date: new Date(current),
        is_recurring_instance: true
      });
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return instances;
}

// Create a new task (parent only)
router.post('/', verifyToken, [
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('points').isInt({ min: 1, max: 100 }).toInt(),
  body('difficulty').isIn(['easy', 'medium', 'hard']),
  body('kid_id').optional().custom((value) => {
    if (value !== null && value !== undefined && value !== '') {
      if (!Number.isInteger(Number(value))) {
        throw new Error('kid_id must be an integer');
      }
      return Number(value);
    }
    return null;
  }),
  body('due_date').optional().custom((value) => {
    if (value && value !== '') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('due_date must be a valid date');
      }
    }
    return true;
  }),
  body('is_recurring').optional().isBoolean(),
  body('recurring_type').optional().isIn(['daily', 'weekly', 'monthly']),
  body('recurring_days').optional().isArray()
], async (req, res) => {
  try {
    console.log('Task creation request body:', req.body);
    
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Only parents can create tasks' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      points,
      difficulty,
      kid_id,
      due_date,
      is_recurring,
      recurring_type,
      recurring_days
    } = req.body;

    // If kid_id is provided, verify it belongs to the parent
    if (kid_id) {
      const kid = await dbHelpers.get(
        'SELECT id FROM kids WHERE id = ? AND parent_id = ?',
        [kid_id, req.user.userId]
      );
      if (!kid) {
        return res.status(400).json({ error: 'Invalid kid ID' });
      }
    }

    const result = await dbHelpers.run(
      `INSERT INTO tasks (
        parent_id, kid_id, title, description, points, difficulty, 
        due_date, is_recurring, recurring_type, recurring_days, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        req.user.userId,
        kid_id || null,
        title,
        description || null,
        points,
        difficulty,
        due_date || null,
        is_recurring || false,
        recurring_type || null,
        recurring_days ? JSON.stringify(recurring_days) : null
      ]
    );

    // Get the created task
    const task = await dbHelpers.get(
      'SELECT * FROM tasks WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      message: 'Task created successfully',
      task
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get all tasks for a parent
router.get('/parent', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await dbHelpers.all(
      `SELECT t.*, k.name as kid_name, k.avatar as kid_avatar 
       FROM tasks t 
       LEFT JOIN kids k ON t.kid_id = k.id 
       WHERE t.parent_id = ? 
       ORDER BY t.created_at DESC`,
      [req.user.userId]
    );

    // Generate recurring task instances for the current period
    const allTasks = [...tasks];
    const now = new Date();
    const startOfPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30); // Next 30 days

    tasks.forEach(task => {
      if (task.is_recurring) {
        const instances = generateRecurringTaskInstances(task, startOfPeriod, endOfPeriod);
        allTasks.push(...instances);
      }
    });

    res.json({ tasks: allTasks });

  } catch (error) {
    console.error('Get parent tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Get tasks for a specific kid
router.get('/kid', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'kid') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await dbHelpers.all(
      `SELECT * FROM tasks 
       WHERE kid_id = ? AND status = 'pending'
       ORDER BY due_date ASC, created_at DESC`,
      [req.user.userId]
    );

    // Generate recurring task instances for the current period
    const allTasks = [...tasks];
    const now = new Date();
    const startOfPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7); // Next 7 days for kids

    tasks.forEach(task => {
      if (task.is_recurring) {
        const instances = generateRecurringTaskInstances(task, startOfPeriod, endOfPeriod);
        allTasks.push(...instances);
      }
    });

    // Filter tasks to only show those due in the current period
    const currentTasks = allTasks.filter(task => {
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        return dueDate >= startOfPeriod && dueDate <= endOfPeriod;
      }
      return true; // Include tasks without due dates
    });

    res.json({ tasks: currentTasks });

  } catch (error) {
    console.error('Get kid tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Update a task (parent only)
router.put('/:taskId', verifyToken, [
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('points').isInt({ min: 1, max: 100 }).toInt(),
  body('difficulty').isIn(['easy', 'medium', 'hard']),
  body('kid_id').optional().custom((value) => {
    if (value !== null && value !== undefined && value !== '') {
      if (!Number.isInteger(Number(value))) {
        throw new Error('kid_id must be an integer');
      }
      return Number(value);
    }
    return null;
  }),
  body('due_date').optional().custom((value) => {
    if (value && value !== '') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('due_date must be a valid date');
      }
    }
    return true;
  }),
  body('is_recurring').optional().isBoolean(),
  body('recurring_type').optional().isIn(['daily', 'weekly', 'monthly']),
  body('recurring_days').optional().isArray()
], async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Only parents can update tasks' });
    }

    const { taskId } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      points,
      difficulty,
      kid_id,
      due_date,
      is_recurring,
      recurring_type,
      recurring_days
    } = req.body;

    // Check if task exists and belongs to parent
    const existingTask = await dbHelpers.get(
      'SELECT * FROM tasks WHERE id = ? AND parent_id = ?',
      [taskId, req.user.userId]
    );

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task
    await dbHelpers.run(
      `UPDATE tasks SET 
        title = ?, description = ?, points = ?, difficulty = ?, 
        kid_id = ?, due_date = ?, is_recurring = ?, recurring_type = ?, 
        recurring_days = ?
       WHERE id = ?`,
      [
        title,
        description || null,
        points,
        difficulty,
        kid_id || null,
        due_date || null,
        is_recurring || false,
        recurring_type || null,
        recurring_days ? JSON.stringify(recurring_days) : null,
        taskId
      ]
    );

    res.json({ message: 'Task updated successfully' });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task (parent only)
router.delete('/:taskId', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Only parents can delete tasks' });
    }

    const { taskId } = req.params;

    // Check if task exists and belongs to parent
    const task = await dbHelpers.get(
      'SELECT * FROM tasks WHERE id = ? AND parent_id = ?',
      [taskId, req.user.userId]
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete task
    await dbHelpers.run('DELETE FROM tasks WHERE id = ?', [taskId]);

    res.json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Complete a task (kid only)
router.patch('/:taskId/complete', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'kid') {
      return res.status(403).json({ error: 'Only kids can complete tasks' });
    }

    const { taskId } = req.params;

    // Get the task and verify it belongs to the kid
    const task = await dbHelpers.get(
      'SELECT * FROM tasks WHERE id = ? AND kid_id = ? AND status = "pending"',
      [taskId, req.user.userId]
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found or already completed' });
    }

    // Update task status
    await dbHelpers.run(
      'UPDATE tasks SET status = "completed", completed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [taskId]
    );

    // Add points to kid
    await dbHelpers.run(
      'UPDATE kids SET points = points + ? WHERE id = ?',
      [task.points, req.user.userId]
    );

    // Get updated kid info
    const kid = await dbHelpers.get(
      'SELECT points, level FROM kids WHERE id = ?',
      [req.user.userId]
    );

    // Check if kid leveled up (every 100 points = 1 level)
    const newLevel = Math.floor(kid.points / 100) + 1;
    if (newLevel > kid.level) {
      await dbHelpers.run(
        'UPDATE kids SET level = ? WHERE id = ?',
        [newLevel, req.user.userId]
      );
    }

    res.json({
      message: 'Task completed successfully!',
      pointsEarned: task.points,
      newTotalPoints: kid.points + task.points,
      leveledUp: newLevel > kid.level,
      newLevel: newLevel > kid.level ? newLevel : kid.level,
      isRecurring: task.is_recurring
    });

  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Update a task (parent only)
router.put('/:taskId', verifyToken, [
  body('title').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('points').optional().isInt({ min: 1, max: 100 }),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('kid_id').optional().isInt(),
  body('due_date').optional().isISO8601(),
  body('status').optional().isIn(['pending', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Only parents can update tasks' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId } = req.params;
    const updateFields = req.body;

    // Verify task belongs to parent
    const existingTask = await dbHelpers.get(
      'SELECT * FROM tasks WHERE id = ? AND parent_id = ?',
      [taskId, req.user.userId]
    );

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Build update query
    const updateKeys = Object.keys(updateFields).filter(key => 
      ['title', 'description', 'points', 'difficulty', 'kid_id', 'due_date', 'status'].includes(key)
    );

    if (updateKeys.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = updateKeys.map(key => `${key} = ?`).join(', ');
    const values = updateKeys.map(key => updateFields[key]);

    await dbHelpers.run(
      `UPDATE tasks SET ${setClause} WHERE id = ?`,
      [...values, taskId]
    );

    // Get updated task
    const updatedTask = await dbHelpers.get(
      'SELECT * FROM tasks WHERE id = ?',
      [taskId]
    );

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task (parent only)
router.delete('/:taskId', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Only parents can delete tasks' });
    }

    const { taskId } = req.params;

    // Verify task belongs to parent
    const task = await dbHelpers.get(
      'SELECT * FROM tasks WHERE id = ? AND parent_id = ?',
      [taskId, req.user.userId]
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await dbHelpers.run('DELETE FROM tasks WHERE id = ?', [taskId]);

    res.json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get task statistics for parent
router.get('/stats/parent', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'parent') {
      return res.status(403).json({ error: 'Access denied' });
    }

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

    res.json({ stats });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router; 