import { calculateExpectedScore, updateEloRating, calculateQuestionDifficulty } from '@/lib/algorithms/elo';

describe('Elo Rating System', () => {
  describe('calculateExpectedScore', () => {
    it('should calculate expected score correctly', () => {
      const playerRating = 1600;
      const opponentRating = 1400;
      const expected = calculateExpectedScore(playerRating, opponentRating);
      expect(expected).toBeGreaterThan(0.5);
      expect(expected).toBeLessThan(1);
    });

    it('should be symmetric', () => {
      const rating1 = 1600;
      const rating2 = 1400;
      const expected1 = calculateExpectedScore(rating1, rating2);
      const expected2 = calculateExpectedScore(rating2, rating1);
      expect(expected1 + expected2).toBeCloseTo(1, 5);
    });
  });

  describe('updateEloRating', () => {
    it('should increase rating on correct answer', () => {
      const current = 1500;
      const expected = 0.5;
      const actual = 1; // correct
      const updated = updateEloRating(current, expected, actual);
      expect(updated).toBeGreaterThan(current);
    });

    it('should decrease rating on incorrect answer', () => {
      const current = 1500;
      const expected = 0.5;
      const actual = 0; // incorrect
      const updated = updateEloRating(current, expected, actual);
      expect(updated).toBeLessThan(current);
    });
  });

  describe('calculateQuestionDifficulty', () => {
    it('should return valid Elo results', () => {
      const result = calculateQuestionDifficulty(1500, 1500, true);
      expect(result).toHaveProperty('questionRating');
      expect(result).toHaveProperty('userRating');
      expect(typeof result.questionRating).toBe('number');
      expect(typeof result.userRating).toBe('number');
    });
  });
});
