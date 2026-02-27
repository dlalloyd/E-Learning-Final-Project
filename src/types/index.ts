/**
 * Global TypeScript types for the Adaptive E-Learning System
 * Updated to reflect IRT 3PL + BKT architecture (ADR-001, ADR-003, ADR-004)
 */

import type { IRTParams, LearnerState, ResponseRecord } from '../lib/algorithms/irt';
import type { KCState } from '../lib/algorithms/bkt';

// ─── Re-exports (single import point for consumers) ───────────────────────────

export type { IRTParams, LearnerState, ResponseRecord } from '../lib/algorithms/irt';
export type { BKTParams, KCState, BKTUpdateResult } from '../lib/algorithms/bkt';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id:        string;
  email:     string;
  name:      string;
  role:      'learner' | 'instructor' | 'admin';
  createdAt: string;
}

// ─── Question ─────────────────────────────────────────────────────────────────

export interface Question {
  id:       string;
  text:     string;
  options:  Record<string, string>;  // e.g. { A: '...', B: '...', C: '...', D: '...' }
  correct:  string;                  // e.g. 'B'
  bloom:    1 | 2 | 3;              // Bloom's taxonomy level
  kc:       string;                  // knowledge component ID
  // IRT 3PL parameters
  a:        number;                  // discrimination
  b:        number;                  // difficulty (logits)
  c:        number;                  // guessing (fixed 0.25)
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface Session {
  id:           string;
  userId:       string;
  condition:    'adaptive' | 'static';  // experimental vs control
  startedAt:    string;
  completedAt?: string;
  learnerState: LearnerState;           // IRT ability trajectory
  kcStates:     Record<string, KCState>; // BKT per-KC mastery
}

// ─── Assessment ───────────────────────────────────────────────────────────────

export interface Assessment {
  id:          string;
  userId:      string;
  sessionId:   string;
  type:        'pre_test' | 'post_test' | 'delayed_post_test';
  score:       number;   // raw score (correct / total)
  maxScore:    number;
  thetaAtTime: number;   // IRT ability estimate at time of assessment
  completedAt: string;
}

// ─── Interaction (single Q&A event) ───────────────────────────────────────────

export interface Interaction {
  id:             string;
  sessionId:      string;
  userId:         string;
  questionId:     string;
  selectedAnswer: string;
  isCorrect:      boolean;
  responseTimeMs: number;
  theta_before:   number;   // IRT ability before this response
  theta_after:    number;   // IRT ability after EAP update
  pLearned_before: number;  // BKT P(KC learned) before
  pLearned_after:  number;  // BKT P(KC learned) after
  timestamp:      string;
}

// ─── Progress (dashboard summary) ─────────────────────────────────────────────

export interface UserProgress {
  userId:          string;
  sessionId:       string;
  currentTheta:    number;   // latest IRT ability estimate
  thetaSd:         number;   // uncertainty in ability estimate
  kcStates:        Record<string, KCState>;
  overallProgress: number;   // 0–100 %
  questionsAnswered: number;
  accuracy:        number;   // overall % correct
}

// ─── Question Bank metadata ───────────────────────────────────────────────────

export interface QuestionBankMetadata {
  version:        string;
  calibrated_by:  string;
  theta_0:        number;
  theta_0_sd:     number;
  theta_0_ci_95:  [number, number];
  model:          string;
  total_items:    number;
  domain:         string;
}

export interface QuestionBank {
  metadata: QuestionBankMetadata;
  items:    Record<string, Omit<Question, 'id'>>;
}