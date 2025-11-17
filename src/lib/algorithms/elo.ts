/**
 * Elo Rating System for Adaptive Question Difficulty
 * Based on Elo (1978)
 */

const INITIAL_RATING = 1500;
const K_FACTOR = 32;

export interface EloResult {
  questionRating: number;
  userRating: number;
}

export function calculateExpectedScore(
  playerRating: number,
  opponentRating: number
): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

export function updateEloRating(
  currentRating: number,
  expectedScore: number,
  actualScore: number,
  kFactor: number = K_FACTOR
): number {
  return currentRating + kFactor * (actualScore - expectedScore);
}

export function calculateQuestionDifficulty(
  questionRating: number,
  userRating: number,
  isCorrect: boolean
): EloResult {
  const expectedScore = calculateExpectedScore(userRating, questionRating);
  const actualScore = isCorrect ? 1 : 0;

  const newQuestionRating = updateEloRating(
    questionRating,
    expectedScore,
    actualScore
  );
  const newUserRating = updateEloRating(
    userRating,
    1 - expectedScore,
    1 - actualScore
  );

  return {
    questionRating: newQuestionRating,
    userRating: newUserRating,
  };
}

export function getQuestionDifficultyLevel(rating: number): string {
  if (rating < 1200) return 'Very Easy';
  if (rating < 1400) return 'Easy';
  if (rating < 1600) return 'Medium';
  if (rating < 1800) return 'Hard';
  return 'Very Hard';
}
