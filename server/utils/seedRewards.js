const { dbHelpers } = require('../database');

/**
 * Fun default rewards to seed new parent accounts with
 * These are suggestions that parents can modify or delete
 */
const defaultRewards = [
  // Small rewards (25-75 points)
  {
    title: '15 minutes extra screen time',
    description: 'Extra gaming, TV, or tablet time',
    points_cost: 25
  },
  {
    title: 'Pick the music in car',
    description: 'Control the playlist for one car ride',
    points_cost: 30
  },
  {
    title: 'Stay up 15 minutes later',
    description: 'Extended bedtime for one night',
    points_cost: 40
  },
  {
    title: 'Choose your own snack',
    description: 'Pick any snack from the pantry',
    points_cost: 35
  },
  {
    title: 'Skip loading dishwasher',
    description: 'Get out of one dishwasher duty',
    points_cost: 50
  },
  {
    title: 'Ice cream after dinner',
    description: 'Special dessert treat',
    points_cost: 60
  },
  {
    title: 'Pick family movie night film',
    description: 'Choose what everyone watches',
    points_cost: 75
  },

  // Medium rewards (80-150 points)
  {
    title: 'Friend over for afternoon',
    description: 'Have a friend visit for 3-4 hours',
    points_cost: 100
  },
  {
    title: 'Skip one weekly chore',
    description: 'Get out of doing one regular chore this week',
    points_cost: 120
  },
  {
    title: 'Choose dinner for family',
    description: 'Pick what everyone eats tonight!',
    points_cost: 90
  },
  {
    title: 'Special one-on-one time',
    description: 'Do any activity with parent for 1 hour',
    points_cost: 110
  },
  {
    title: 'Stay up 1 hour later',
    description: 'Extended bedtime for weekend night',
    points_cost: 80
  },
  {
    title: 'Trip to local park/playground',
    description: 'Special outing just for you',
    points_cost: 130
  },
  {
    title: 'Bake cookies together',
    description: 'Make your favorite cookies with parent',
    points_cost: 85
  },

  // Big rewards (200+ points)
  {
    title: 'Friend sleepover',
    description: 'Have a friend over for sleepover weekend',
    points_cost: 250
  },
  {
    title: 'Movie theater trip',
    description: 'Go see any movie you want at the theater',
    points_cost: 200
  },
  {
    title: '$10 spending money',
    description: 'Cash to spend however you want',
    points_cost: 300
  },
  {
    title: 'New toy or book',
    description: 'Pick out something special under $15',
    points_cost: 350
  },
  {
    title: 'Arcade/Fun center trip',
    description: 'Spend an afternoon at your favorite fun place',
    points_cost: 280
  },
  {
    title: 'Special day out',
    description: 'Plan a whole day doing your favorite activities',
    points_cost: 400
  },
  {
    title: 'Skip chores for a week',
    description: 'Get out of all chores for 7 days',
    points_cost: 500
  },

  // Premium rewards (500+ points)
  {
    title: '$25 shopping spree',
    description: 'Big spending money for toys, clothes, or treats',
    points_cost: 600
  },
  {
    title: 'Theme park day',
    description: 'Full day at amusement park or water park',
    points_cost: 800
  },
  {
    title: 'New video game',
    description: 'Pick any game under $60',
    points_cost: 750
  },
  {
    title: 'Weekend camping trip',
    description: 'Special outdoor adventure weekend',
    points_cost: 900
  },
  {
    title: 'Big toy or electronics',
    description: 'Something special you\'ve been wanting (up to $100)',
    points_cost: 1000
  }
];

/**
 * Seed default rewards for a new parent
 * @param {number} parentId - The parent's ID
 */
async function seedDefaultRewards(parentId) {
  try {
    console.log(`Seeding default rewards for parent ${parentId}...`);
    
    for (const reward of defaultRewards) {
      await dbHelpers.run(
        'INSERT INTO rewards (parent_id, title, description, points_cost, is_active) VALUES (?, ?, ?, ?, 1)',
        [parentId, reward.title, reward.description, reward.points_cost]
      );
    }
    
    console.log(`✅ Seeded ${defaultRewards.length} default rewards for parent ${parentId}`);
  } catch (error) {
    console.error('Error seeding default rewards:', error);
    throw error;
  }
}

/**
 * Check if parent already has rewards (to avoid duplicate seeding)
 * @param {number} parentId - The parent's ID
 * @returns {boolean} True if parent already has rewards
 */
async function parentHasRewards(parentId) {
  try {
    const result = await dbHelpers.get(
      'SELECT COUNT(*) as count FROM rewards WHERE parent_id = ?',
      [parentId]
    );
    return result.count > 0;
  } catch (error) {
    console.error('Error checking parent rewards:', error);
    return false;
  }
}

/**
 * Seed rewards for a parent if they don't have any yet
 * @param {number} parentId - The parent's ID
 */
async function seedRewardsIfEmpty(parentId) {
  try {
    const hasRewards = await parentHasRewards(parentId);
    if (!hasRewards) {
      await seedDefaultRewards(parentId);
      return true; // Seeded
    }
    return false; // Already had rewards
  } catch (error) {
    console.error('Error in seedRewardsIfEmpty:', error);
    throw error;
  }
}

module.exports = {
  defaultRewards,
  seedDefaultRewards,
  seedRewardsIfEmpty,
  parentHasRewards
};