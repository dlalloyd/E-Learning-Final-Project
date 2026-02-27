/**
 * Bayesian Knowledge Tracing (BKT)
 * Corbett & Anderson (1995) hidden Markov model for knowledge state estimation
 *
 * Works alongside IRT (irt.ts):
 *   - IRT handles ability estimation and question selection (continuous θ)
 *   - BKT handles per-knowledge-component mastery tracking (binary learned/unlearned)
 *
 * Four parameters per knowledge component (KC):
 *   pL0   — prior probability of knowing KC before any practice
 *   pT    — probability of learning KC on any given opportunity (transit)
 *   pS    — probability of answering incorrectly despite knowing (slip)
 *   pG    — probability of answering correctly without knowing (guess)
 *
 * References:
 *   Corbett, A.T., & Anderson, J.R. (1995). Knowledge tracing: Modelling
 *     the acquisition of procedural knowledge. User Modeling and
 *     User-Adapted Interaction, 4(4), 253-278.
 *   Beck, J., & Chang, K. (2007). Identifiability: A fundamental problem
 *     of student modeling. User Modeling 2007, 137-146.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BKTParams {
  pL0: number;  // prior knowledge probability (0–1)
  pT:  number;  // learning/transition probability (0–1)
  pS:  number;  // slip probability (0–1)
  pG:  number;  // guess probability (0–1)
}

export interface KCState {
  kcId:        string;
  pLearned:    number;   // current probability of knowing KC
  attempts:    number;   // total questions answered for this KC
  correct:     number;   // total correct for this KC
  isMastered:  boolean;  // pLearned >= MASTERY_THRESHOLD
}

export interface BKTUpdateResult {
  pLearned_before: number;
  pLearned_after:  number;
  isMastered:      boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Mastery threshold — Ritter et al. (2016)
 * KC considered mastered when P(Learned) >= 0.95
 * Note: higher than IRT mastery (0.80) because BKT is binary state estimation
 */
const MASTERY_THRESHOLD = 0.95;

/**
 * Default BKT parameters for UK Geography knowledge components
 * Seeded from curriculum difficulty estimates (DfE, 2013; Catling & Willy, 2021)
 * Will be updated empirically after Phase 4 user study data collected
 */
export const DEFAULT_BKT_PARAMS: Record<string, BKTParams> = {
  // Level 1 — Remembering (lower pL0 = less prior knowledge expected)
  UK_national_parks: {
    pL0: 0.40, pT: 0.20, pS: 0.10, pG: 0.25,
  },
  UK_capitals: {
    pL0: 0.60, pT: 0.25, pS: 0.08, pG: 0.25,
  },
  UK_county_locations: {
    pL0: 0.30, pT: 0.20, pS: 0.12, pG: 0.25,
  },
  UK_rivers: {
    pL0: 0.50, pT: 0.22, pS: 0.10, pG: 0.25,
  },
  UK_mountains: {
    pL0: 0.45, pT: 0.20, pS: 0.10, pG: 0.25,
  },

  // Level 2 — Understanding (moderate prior; requires causal reasoning)
  westerly_winds_rainfall: {
    pL0: 0.25, pT: 0.18, pS: 0.12, pG: 0.25,
  },
  maritime_continental: {
    pL0: 0.20, pT: 0.18, pS: 0.12, pG: 0.25,
  },
  pennines_rain_shadow: {
    pL0: 0.20, pT: 0.15, pS: 0.15, pG: 0.25,
  },
  north_atlantic_drift: {
    pL0: 0.22, pT: 0.18, pS: 0.12, pG: 0.25,
  },
  continental_effect: {
    pL0: 0.18, pT: 0.15, pS: 0.15, pG: 0.25,
  },

  // Level 3 — Applying (lowest prior; requires synthesis)
  climate_classification: {
    pL0: 0.15, pT: 0.15, pS: 0.18, pG: 0.25,
  },
  climate_change_application: {
    pL0: 0.12, pT: 0.15, pS: 0.18, pG: 0.25,
  },
  flood_risk_integration: {
    pL0: 0.10, pT: 0.12, pS: 0.20, pG: 0.25,
  },
};

// ─── Core BKT Functions ───────────────────────────────────────────────────────

/**
 * Initialise knowledge state for a single KC
 */
export function initialiseKC(kcId: string, params: BKTParams): KCState {
  return {
    kcId,
    pLearned: params.pL0,
    attempts: 0,
    correct: 0,
    isMastered: params.pL0 >= MASTERY_THRESHOLD,
  };
}

/**
 * Update BKT knowledge state after one response
 *
 * Step 1: Bayesian update — given observed response, update P(Learned)
 * Step 2: Learning transition — apply pT to account for possible learning
 *
 * @param pLearned  Current P(KC learned)
 * @param isCorrect Whether the learner answered correctly
 * @param params    BKT parameters for this KC
 */
export function updateBKT(
  pLearned: number,
  isCorrect: boolean,
  params: BKTParams
): BKTUpdateResult {
  const { pT, pS, pG } = params;
  const pLearned_before = pLearned;

  // Step 1: Bayesian update on knowledge state given response
  let pLearnedGivenResponse: number;

  if (isCorrect) {
    // P(Learned | correct) = P(correct | Learned) * P(Learned) / P(correct)
    const pCorrect = pLearned * (1 - pS) + (1 - pLearned) * pG;
    pLearnedGivenResponse = (pLearned * (1 - pS)) / pCorrect;
  } else {
    // P(Learned | incorrect) = P(incorrect | Learned) * P(Learned) / P(incorrect)
    const pIncorrect = pLearned * pS + (1 - pLearned) * (1 - pG);
    pLearnedGivenResponse = (pLearned * pS) / pIncorrect;
  }

  // Step 2: Apply learning transition
  // P(Learned after) = P(already learned) + P(not yet learned) * P(learn now)
  const pLearned_after = pLearnedGivenResponse + (1 - pLearnedGivenResponse) * pT;

  // Clamp to valid probability range
  const pLearned_clamped = Math.max(0, Math.min(1, pLearned_after));

  return {
    pLearned_before,
    pLearned_after: pLearned_clamped,
    isMastered: pLearned_clamped >= MASTERY_THRESHOLD,
  };
}

/**
 * Update a full KC state record after one response
 * Returns new state — does not mutate input
 */
export function updateKCState(
  state: KCState,
  isCorrect: boolean,
  params: BKTParams
): KCState {
  const result = updateBKT(state.pLearned, isCorrect, params);

  return {
    ...state,
    pLearned: result.pLearned_after,
    attempts: state.attempts + 1,
    correct: state.correct + (isCorrect ? 1 : 0),
    isMastered: result.isMastered,
  };
}

/**
 * Initialise all KC states from the default parameter set
 * Called at the start of each learner session
 */
export function initialiseAllKCs(): Record<string, KCState> {
  const states: Record<string, KCState> = {};
  for (const [kcId, params] of Object.entries(DEFAULT_BKT_PARAMS)) {
    states[kcId] = initialiseKC(kcId, params);
  }
  return states;
}

/**
 * Check if all KCs are mastered (session complete)
 */
export function isSessionComplete(kcStates: Record<string, KCState>): boolean {
  return Object.values(kcStates).every((s) => s.isMastered);
}

/**
 * Get the weakest unmastered KC by lowest pLearned
 * Used as fallback when IRT maximum information selection is ambiguous
 */
export function getWeakestKC(
  kcStates: Record<string, KCState>
): KCState | null {
  const unmastered = Object.values(kcStates).filter((s) => !s.isMastered);
  if (unmastered.length === 0) return null;
  return unmastered.sort((a, b) => a.pLearned - b.pLearned)[0];
}

/**
 * Summarise session KC progress for dashboard display
 */
export function getSessionSummary(kcStates: Record<string, KCState>): {
  total: number;
  mastered: number;
  inProgress: number;
  notStarted: number;
  overallProgress: number;
} {
  const all = Object.values(kcStates);
  const mastered = all.filter((s) => s.isMastered).length;
  const inProgress = all.filter((s) => !s.isMastered && s.attempts > 0).length;
  const notStarted = all.filter((s) => s.attempts === 0).length;

  return {
    total: all.length,
    mastered,
    inProgress,
    notStarted,
    overallProgress: Math.round((mastered / all.length) * 100),
  };
}