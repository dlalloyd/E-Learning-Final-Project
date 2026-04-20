/**
 * Session Flow Logic
 *
 * Pure functions governing UI gate decisions in the session lifecycle.
 * Kept separate from components so they can be unit tested without
 * rendering, and reused across the app without prop-drilling.
 */

// ─── shouldShowConditionExplainer ────────────────────────────────────────────

interface ConditionExplainerInput {
  hasSeenExplainer: boolean;
}

/**
 * Returns true when the condition explanation screen should be shown.
 * Shows exactly once per user, before their first session start.
 *
 * Persisted via localStorage key 'gm_condition_explainer_seen'.
 */
export function shouldShowConditionExplainer(
  input: ConditionExplainerInput
): boolean {
  return !input.hasSeenExplainer;
}

// ─── shouldShowSUS ───────────────────────────────────────────────────────────

interface SUSInput {
  completedSessions: number;
  hasCompletedSUS: boolean;
  condition?: 'adaptive' | 'static';
}

/**
 * Returns true when the SUS questionnaire should be shown.
 * Triggers after the user's first completed session, regardless of condition.
 * Does not re-trigger if the user has already submitted the SUS.
 *
 * References: Brooke (1996) System Usability Scale.
 */
export function shouldShowSUS(input: SUSInput): boolean {
  if (input.hasCompletedSUS) return false;
  return input.completedSessions === 1;
}
