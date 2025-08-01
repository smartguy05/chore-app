/**
 * Frontend Exponential Leveling System
 * Mirrors the backend leveling calculations
 */

const BASE_POINTS = 50;
const MULTIPLIER = 1.5;

export interface LevelProgress {
  currentLevel: number;
  totalPoints: number;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  progressPercentage: number;
  pointsToNextLevel: number;
}

/**
 * Calculate the total points required to reach a specific level
 */
export function getPointsRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  
  let totalPoints = 0;
  for (let i = 1; i < level; i++) {
    totalPoints += getPointsRequiredForLevelUp(i);
  }
  return Math.floor(totalPoints);
}

/**
 * Calculate points needed to level up FROM a specific level
 */
export function getPointsRequiredForLevelUp(currentLevel: number): number {
  return Math.floor(BASE_POINTS * Math.pow(MULTIPLIER, currentLevel - 1));
}

/**
 * Calculate the current level based on total points
 */
export function calculateLevelFromPoints(totalPoints: number): number {
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
 */
export function getLevelProgress(totalPoints: number): LevelProgress {
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

export { BASE_POINTS, MULTIPLIER };