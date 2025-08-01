/**
 * One-time script to seed rewards for existing parent accounts
 * Run this script after implementing the rewards system
 */

const { dbHelpers } = require('../database');
const { seedRewardsIfEmpty } = require('../utils/seedRewards');

async function seedAllExistingParents() {
  try {
    console.log('🌱 Starting to seed rewards for existing parents...');
    
    // Get all parent IDs
    const parents = await dbHelpers.all('SELECT id, name FROM parents');
    
    if (parents.length === 0) {
      console.log('No parents found in database.');
      return;
    }
    
    console.log(`Found ${parents.length} parent(s) to process.`);
    
    let seededCount = 0;
    let skippedCount = 0;
    
    for (const parent of parents) {
      try {
        const wasSeeded = await seedRewardsIfEmpty(parent.id);
        if (wasSeeded) {
          console.log(`✅ Seeded rewards for parent ${parent.name} (ID: ${parent.id})`);
          seededCount++;
        } else {
          console.log(`⏭️  Parent ${parent.name} (ID: ${parent.id}) already has rewards, skipping`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to seed rewards for parent ${parent.name} (ID: ${parent.id}):`, error.message);
      }
    }
    
    console.log('\n🎉 Seeding complete!');
    console.log(`📊 Summary: ${seededCount} seeded, ${skippedCount} skipped`);
    
  } catch (error) {
    console.error('❌ Error during seeding process:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  seedAllExistingParents();
}

module.exports = { seedAllExistingParents };