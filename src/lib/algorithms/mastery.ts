/**
 * Mastery Threshold Logic for Content Sequencing
 */

const MASTERY_THRESHOLD = 0.8; // 80% accuracy

export interface TopicMastery {
  topicId: string;
  accuracy: number;
  questionCount: number;
  isMastered: boolean;
  readyForNext: boolean;
}

export function checkMastery(accuracy: number): boolean {
  return accuracy >= MASTERY_THRESHOLD * 100;
}

export function calculateTopicAccuracy(
  correctAnswers: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0;
  return (correctAnswers / totalQuestions) * 100;
}

export function determineNextTopic(
  currentAccuracy: number,
  attemptCount: number
): string {
  if (checkMastery(currentAccuracy)) {
    return 'ready_for_next';
  }

  if (attemptCount >= 3 && currentAccuracy >= 60) {
    return 'skip_to_next';
  }

  return 'review_current';
}
