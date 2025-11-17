export interface User {
  id: string;
  email: string;
  name: string;
  role: 'learner' | 'instructor' | 'admin';
}

export interface Question {
  id: string;
  text: string;
  difficulty: number;
  type: 'multiple_choice' | 'short_answer' | 'essay';
}

export interface Assessment {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  maxScore: number;
  passed: boolean;
}

export interface UserProgress {
  userId: string;
  topicId: string;
  accuracy: number;
  completed: boolean;
}
