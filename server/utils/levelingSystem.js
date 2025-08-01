/**
 * Exponential Leveling System
 * 
 * Formula: pointsRequired = basePoints * (multiplier ^ (level - 1))
 * - Level 1: 50 points (easy to achieve quickly)
 * - Level 2: 75 points (50 * 1.5^1)
 * - Level 3: 113 points (50 * 1.5^2)
 * - Level 4: 169 points (50 * 1.5^3)
 * - Level 5: 253 points (50 * 1.5^4)
 * - Level 10: 1,708 points
 * - Level 20: 115,473 points
 * - Level 50: 2.2 billion points (practically impossible)
 */

const BASE_POINTS = 50;
const MULTIPLIER = 1.5;

/**
 * Calculate the total points required to reach a specific level
 * @param {number} level - The target level (1-based)
 * @returns {number} Total points required to reach this level
 */
function getPointsRequiredForLevel(level) {
  if (level <= 1) return 0;
  
  let totalPoints = 0;
  for (let i = 1; i < level; i++) {
    totalPoints += getPointsRequiredForLevelUp(i);
  }
  return Math.floor(totalPoints);
}

/**
 * Calculate points needed to level up FROM a specific level
 * @param {number} currentLevel - The current level (1-based)
 * @returns {number} Points needed to level up from this level
 */
function getPointsRequiredForLevelUp(currentLevel) {
  return Math.floor(BASE_POINTS * Math.pow(MULTIPLIER, currentLevel - 1));
}

/**
 * Calculate the current level based on total points
 * @param {number} totalPoints - Total points accumulated
 * @returns {number} Current level (1-based, minimum 1)
 */
function calculateLevelFromPoints(totalPoints) {
  if (totalPoints < 0) return 1;
  
  let level = 1;
  let pointsUsed = 0;
  
  while (true) {
    const pointsNeeded = getPointsRequiredForLevelUp(level);
    if (pointsUsed + pointsNeeded > totalPoints) {
      break;
    }
    pointsUsed += pointsNeeded;
    level++;
  }
  
  return level;
}

/**
 * Get progress information for the current level
 * @param {number} totalPoints - Total points accumulated
 * @returns {object} Progress information
 */
function getLevelProgress(totalPoints) {
  const currentLevel = calculateLevelFromPoints(totalPoints);
  const pointsRequiredForCurrentLevel = getPointsRequiredForLevel(currentLevel);
  const pointsRequiredForNextLevel = getPointsRequiredForLevel(currentLevel + 1);
  
  const pointsInCurrentLevel = totalPoints - pointsRequiredForCurrentLevel;
  const pointsNeededForNextLevel = pointsRequiredForNextLevel - pointsRequiredForCurrentLevel;
  const progressPercentage = Math.floor((pointsInCurrentLevel / pointsNeededForNextLevel) * 100);
  
  return {
    currentLevel,
    totalPoints,
    pointsInCurrentLevel,
    pointsNeededForNextLevel,
    progressPercentage,
    pointsToNextLevel: pointsNeededForNextLevel - pointsInCurrentLevel
  };
}

/**
 * Check if points gained results in a level up
 * @param {number} oldPoints - Points before gaining new points
 * @param {number} newPoints - Points after gaining new points
 * @returns {object} Level up information
 */
function checkLevelUp(oldPoints, newPoints) {
  const oldLevel = calculateLevelFromPoints(oldPoints);
  const newLevel = calculateLevelFromPoints(newPoints);
  
  return {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
    levelsGained: newLevel - oldLevel
  };
}

module.exports = {
  getPointsRequiredForLevel,
  getPointsRequiredForLevelUp,
  calculateLevelFromPoints,
  getLevelProgress,
  checkLevelUp,
  BASE_POINTS,
  MULTIPLIER
};