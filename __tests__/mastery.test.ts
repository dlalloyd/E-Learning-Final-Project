import { checkMastery, calculateTopicAccuracy, determineNextTopic } from '@/lib/algorithms/mastery';

describe('Mastery Threshold Logic', () => {
  describe('checkMastery', () => {
    it('should return true when accuracy >= 80%', () => {
      expect(checkMastery(80)).toBe(true);
      expect(checkMastery(85)).toBe(true);
      expect(checkMastery(100)).toBe(true);
    });

    it('should return false when accuracy < 80%', () => {
      expect(checkMastery(79.9)).toBe(false);
      expect(checkMastery(50)).toBe(false);
      expect(checkMastery(0)).toBe(false);
    });
  });

  describe('calculateTopicAccuracy', () => {
    it('should calculate accuracy correctly', () => {
      expect(calculateTopicAccuracy(8, 10)).toBe(80);
      expect(calculateTopicAccuracy(5, 10)).toBe(50);
      expect(calculateTopicAccuracy(10, 10)).toBe(100);
    });

    it('should return 0 for zero questions', () => {
      expect(calculateTopicAccuracy(0, 0)).toBe(0);
    });
  });

  describe('determineNextTopic', () => {
    it('should return ready_for_next when mastered', () => {
      expect(determineNextTopic(85, 1)).toBe('ready_for_next');
    });

    it('should return skip_to_next when 60%+ after 3 attempts', () => {
      expect(determineNextTopic(65, 3)).toBe('skip_to_next');
    });

    it('should return review_current otherwise', () => {
      expect(determineNextTopic(50, 1)).toBe('review_current');
    });
  });
});
