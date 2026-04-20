/**
 * Session Flow Logic — TDD
 *
 * Pure functions governing:
 *   1. shouldShowConditionExplainer — gate for the condition selection screen
 *   2. shouldShowSUS — gate for the SUS questionnaire trigger
 *
 * RED phase: these tests should FAIL before implementation exists.
 */

import {
  shouldShowConditionExplainer,
  shouldShowSUS,
} from '../src/lib/sessionFlow';

// ─── shouldShowConditionExplainer ────────────────────────────────────────────

describe('shouldShowConditionExplainer', () => {
  it('returns true when the user has never seen the explainer', () => {
    expect(shouldShowConditionExplainer({ hasSeenExplainer: false })).toBe(true);
  });

  it('returns false when the user has already seen the explainer', () => {
    expect(shouldShowConditionExplainer({ hasSeenExplainer: true })).toBe(false);
  });

  it('returns true for a brand-new user (default: no explainer seen)', () => {
    // A new user will never have hasSeenExplainer = true in storage
    expect(shouldShowConditionExplainer({ hasSeenExplainer: false })).toBe(true);
  });

  it('returns false on the second session start (explainer already shown)', () => {
    expect(shouldShowConditionExplainer({ hasSeenExplainer: true })).toBe(false);
  });
});

// ─── shouldShowSUS ───────────────────────────────────────────────────────────

describe('shouldShowSUS', () => {
  it('returns true after exactly 1 completed session', () => {
    expect(shouldShowSUS({ completedSessions: 1, hasCompletedSUS: false })).toBe(true);
  });

  it('returns false when no sessions have been completed yet', () => {
    expect(shouldShowSUS({ completedSessions: 0, hasCompletedSUS: false })).toBe(false);
  });

  it('returns false when more than 1 session has been completed (not first session any more)', () => {
    expect(shouldShowSUS({ completedSessions: 2, hasCompletedSUS: false })).toBe(false);
    expect(shouldShowSUS({ completedSessions: 5, hasCompletedSUS: false })).toBe(false);
  });

  it('returns false when user has already completed the SUS (no repeat prompt)', () => {
    expect(shouldShowSUS({ completedSessions: 1, hasCompletedSUS: true })).toBe(false);
  });

  it('condition does not affect the SUS trigger — both conditions count equally', () => {
    // Whether the user chose adaptive or static, 1 completed session = SUS prompt
    expect(shouldShowSUS({ completedSessions: 1, hasCompletedSUS: false, condition: 'adaptive' })).toBe(true);
    expect(shouldShowSUS({ completedSessions: 1, hasCompletedSUS: false, condition: 'static' })).toBe(true);
  });
});
