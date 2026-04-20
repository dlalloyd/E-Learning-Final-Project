/**
 * BKT (Bayesian Knowledge Tracing) — Unit Tests
 *
 * Validates:
 *   - updateBKT: Bayesian posterior update + learning transition
 *   - updateKCState: full state record management
 *   - initialiseKC / initialiseAllKCs
 *   - isSessionComplete
 *   - getWeakestKC
 *   - getSessionSummary
 *   - Graduated hint credit factor behaviour
 *
 * References:
 *   Corbett & Anderson (1995). Knowledge tracing.
 *   Koedinger & Aleven (2007). Exploring the assistance dilemma.
 */

import {
  updateBKT,
  updateKCState,
  initialiseKC,
  initialiseAllKCs,
  isSessionComplete,
  getWeakestKC,
  getSessionSummary,
  DEFAULT_BKT_PARAMS,
  type BKTParams,
  type KCState,
} from '../src/lib/algorithms/bkt';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TYPICAL_PARAMS: BKTParams = { pL0: 0.3, pT: 0.2, pS: 0.1, pG: 0.25 };

function makeKC(id: string, pLearned: number, attempts = 0, correct = 0): KCState {
  return {
    kcId: id,
    pLearned,
    attempts,
    correct,
    isMastered: pLearned >= 0.95,
  };
}

// ─── updateBKT ────────────────────────────────────────────────────────────────

describe('updateBKT', () => {
  it('pLearned_after is strictly greater than pLearned_before on correct response', () => {
    const result = updateBKT(0.3, true, TYPICAL_PARAMS);
    expect(result.pLearned_after).toBeGreaterThan(result.pLearned_before);
  });

  it('pLearned_after decreases on incorrect response (below the initial prior)', () => {
    // Incorrect evidence should lower P(Learned) before the transition kicks in.
    // Net effect depends on parameters, but posterior alone should be lower.
    const params: BKTParams = { pL0: 0.8, pT: 0.0, pS: 0.1, pG: 0.25 };
    const result = updateBKT(0.8, false, params);
    expect(result.pLearned_after).toBeLessThan(0.8);
  });

  it('output is bounded to [0, 1]', () => {
    const extreme: BKTParams = { pL0: 1.0, pT: 1.0, pS: 0.0, pG: 0.0 };
    const r1 = updateBKT(0.99, true,  extreme);
    const r2 = updateBKT(0.0,  false, extreme);
    expect(r1.pLearned_after).toBeLessThanOrEqual(1.0);
    expect(r2.pLearned_after).toBeGreaterThanOrEqual(0.0);
  });

  it('isMastered is true when pLearned_after >= 0.95', () => {
    const highPrior: BKTParams = { pL0: 0.93, pT: 0.3, pS: 0.05, pG: 0.25 };
    const result = updateBKT(0.93, true, highPrior);
    if (result.pLearned_after >= 0.95) {
      expect(result.isMastered).toBe(true);
    }
  });

  it('isMastered is false when pLearned_after < 0.95', () => {
    const result = updateBKT(0.3, false, TYPICAL_PARAMS);
    expect(result.isMastered).toBe(false);
  });

  it('creditFactor=0 leaves pLearned completely unchanged on correct response', () => {
    const result = updateBKT(0.3, true, TYPICAL_PARAMS, 0.0);
    // With factor=0: posterior contribution = 0 (no Bayesian update),
    // and transitionBoost = pT * factor = 0 (no learning transition on hint-only correct).
    // Net: pLearned_after == pLearned_before.
    expect(result.pLearned_after).toBeCloseTo(0.3, 5);
  });

  it('creditFactor=1.0 gives full Bayesian update', () => {
    const full    = updateBKT(0.3, true, TYPICAL_PARAMS, 1.0);
    const default_ = updateBKT(0.3, true, TYPICAL_PARAMS);
    expect(full.pLearned_after).toBeCloseTo(default_.pLearned_after, 8);
  });

  it('partial creditFactor gives intermediate result between 0 and full update', () => {
    const full    = updateBKT(0.3, true, TYPICAL_PARAMS, 1.0).pLearned_after;
    const partial = updateBKT(0.3, true, TYPICAL_PARAMS, 0.5).pLearned_after;
    const none    = updateBKT(0.3, true, TYPICAL_PARAMS, 0.0).pLearned_after;
    expect(partial).toBeGreaterThan(none);
    expect(partial).toBeLessThan(full);
  });

  it('repeated correct responses converge pLearned toward 1', () => {
    let p = TYPICAL_PARAMS.pL0;
    for (let i = 0; i < 20; i++) {
      const r = updateBKT(p, true, TYPICAL_PARAMS);
      p = r.pLearned_after;
    }
    expect(p).toBeGreaterThan(0.90);
  });

  it('repeated incorrect responses drive pLearned toward a low stable point', () => {
    const params: BKTParams = { pL0: 0.5, pT: 0.05, pS: 0.1, pG: 0.25 };
    let p = params.pL0;
    for (let i = 0; i < 10; i++) {
      const r = updateBKT(p, false, params);
      p = r.pLearned_after;
    }
    expect(p).toBeLessThan(0.5);
  });
});

// ─── updateKCState ────────────────────────────────────────────────────────────

describe('updateKCState', () => {
  it('increments attempts on every call', () => {
    const state = makeKC('UK_county_locations', 0.3, 0, 0);
    const next  = updateKCState(state, true, TYPICAL_PARAMS);
    expect(next.attempts).toBe(1);
  });

  it('increments correct count for unassisted correct response', () => {
    const state = makeKC('UK_county_locations', 0.3, 0, 0);
    const next  = updateKCState(state, true, TYPICAL_PARAMS, 1.0);
    expect(next.correct).toBe(1);
  });

  it('does NOT increment correct count for hint-assisted response (creditFactor < 1)', () => {
    const state = makeKC('UK_county_locations', 0.3, 2, 1);
    const next  = updateKCState(state, true, TYPICAL_PARAMS, 0.7);
    expect(next.correct).toBe(1); // unchanged
  });

  it('does not mutate the original state', () => {
    const state = makeKC('UK_county_locations', 0.3, 0, 0);
    updateKCState(state, true, TYPICAL_PARAMS);
    expect(state.attempts).toBe(0);
    expect(state.correct).toBe(0);
  });

  it('updates pLearned after response', () => {
    const state = makeKC('UK_county_locations', 0.3);
    const next  = updateKCState(state, true, TYPICAL_PARAMS);
    expect(next.pLearned).toBeGreaterThan(0.3);
  });
});

// ─── initialiseKC ─────────────────────────────────────────────────────────────

describe('initialiseKC', () => {
  it('sets pLearned to pL0', () => {
    const state = initialiseKC('UK_county_locations', TYPICAL_PARAMS);
    expect(state.pLearned).toBe(TYPICAL_PARAMS.pL0);
  });

  it('sets attempts and correct to 0', () => {
    const state = initialiseKC('UK_county_locations', TYPICAL_PARAMS);
    expect(state.attempts).toBe(0);
    expect(state.correct).toBe(0);
  });

  it('isMastered is true when pL0 >= 0.95', () => {
    const params: BKTParams = { ...TYPICAL_PARAMS, pL0: 0.97 };
    const state = initialiseKC('test_kc', params);
    expect(state.isMastered).toBe(true);
  });

  it('isMastered is false when pL0 < 0.95', () => {
    const state = initialiseKC('test_kc', TYPICAL_PARAMS);
    expect(state.isMastered).toBe(false);
  });
});

// ─── initialiseAllKCs ─────────────────────────────────────────────────────────

describe('initialiseAllKCs', () => {
  it('returns a state for every KC in DEFAULT_BKT_PARAMS', () => {
    const states = initialiseAllKCs();
    const defaultKeys = Object.keys(DEFAULT_BKT_PARAMS);
    expect(Object.keys(states)).toEqual(expect.arrayContaining(defaultKeys));
    expect(Object.keys(states).length).toBe(defaultKeys.length);
  });

  it('each state has the correct initial pLearned', () => {
    const states = initialiseAllKCs();
    for (const [kcId, params] of Object.entries(DEFAULT_BKT_PARAMS)) {
      expect(states[kcId].pLearned).toBe(params.pL0);
    }
  });
});

// ─── isSessionComplete ────────────────────────────────────────────────────────

describe('isSessionComplete', () => {
  it('returns true when all KCs are mastered', () => {
    const states: Record<string, KCState> = {
      kc1: makeKC('kc1', 0.97),
      kc2: makeKC('kc2', 0.98),
    };
    expect(isSessionComplete(states)).toBe(true);
  });

  it('returns false when any KC is not mastered', () => {
    const states: Record<string, KCState> = {
      kc1: makeKC('kc1', 0.97),
      kc2: makeKC('kc2', 0.40),
    };
    expect(isSessionComplete(states)).toBe(false);
  });

  it('returns true for empty state set', () => {
    // every() on empty array returns true
    expect(isSessionComplete({})).toBe(true);
  });
});

// ─── getWeakestKC ─────────────────────────────────────────────────────────────

describe('getWeakestKC', () => {
  it('returns null when all KCs are mastered', () => {
    const states: Record<string, KCState> = {
      kc1: makeKC('kc1', 0.97),
    };
    expect(getWeakestKC(states)).toBeNull();
  });

  it('returns the KC with lowest pLearned among unmastered KCs', () => {
    const states: Record<string, KCState> = {
      kc1: makeKC('kc1', 0.50),
      kc2: makeKC('kc2', 0.20),
      kc3: makeKC('kc3', 0.97),
    };
    const weakest = getWeakestKC(states);
    expect(weakest).not.toBeNull();
    expect(weakest!.kcId).toBe('kc2');
  });

  it('ignores mastered KCs in selection', () => {
    const states: Record<string, KCState> = {
      kc1: makeKC('kc1', 0.97),
      kc2: makeKC('kc2', 0.60),
    };
    const weakest = getWeakestKC(states);
    expect(weakest!.kcId).toBe('kc2');
  });
});

// ─── getSessionSummary ────────────────────────────────────────────────────────

describe('getSessionSummary', () => {
  it('counts mastered, in-progress, and not-started correctly', () => {
    const states: Record<string, KCState> = {
      kc1: makeKC('kc1', 0.97, 5, 4),   // mastered
      kc2: makeKC('kc2', 0.50, 3, 2),   // in progress
      kc3: makeKC('kc3', 0.20, 0, 0),   // not started
      kc4: makeKC('kc4', 0.10, 0, 0),   // not started
    };
    const summary = getSessionSummary(states);
    expect(summary.total).toBe(4);
    expect(summary.mastered).toBe(1);
    expect(summary.inProgress).toBe(1);
    expect(summary.notStarted).toBe(2);
  });

  it('overall progress = (mastered / total) * 100, rounded', () => {
    const states: Record<string, KCState> = {
      kc1: makeKC('kc1', 0.97, 3, 3),
      kc2: makeKC('kc2', 0.97, 3, 3),
      kc3: makeKC('kc3', 0.30, 1, 0),
      kc4: makeKC('kc4', 0.10, 0, 0),
    };
    const summary = getSessionSummary(states);
    expect(summary.overallProgress).toBe(50); // 2/4
  });

  it('returns 100% progress when all KCs mastered', () => {
    const states: Record<string, KCState> = {
      kc1: makeKC('kc1', 0.97, 5, 5),
      kc2: makeKC('kc2', 0.99, 5, 5),
    };
    const summary = getSessionSummary(states);
    expect(summary.overallProgress).toBe(100);
  });
});

// ─── DEFAULT_BKT_PARAMS validation ───────────────────────────────────────────

describe('DEFAULT_BKT_PARAMS', () => {
  it('all params are within valid [0, 1] bounds', () => {
    for (const [kcId, params] of Object.entries(DEFAULT_BKT_PARAMS)) {
      expect(params.pL0).toBeGreaterThanOrEqual(0);
      expect(params.pL0).toBeLessThanOrEqual(1);
      expect(params.pT).toBeGreaterThanOrEqual(0);
      expect(params.pT).toBeLessThanOrEqual(1);
      expect(params.pS).toBeGreaterThanOrEqual(0);
      expect(params.pS).toBeLessThanOrEqual(1);
      expect(params.pG).toBeGreaterThanOrEqual(0);
      expect(params.pG).toBeLessThanOrEqual(1);
      // Beck & Chang (2007): pS + pG < 1 required for identifiability
      expect(params.pS + params.pG).toBeLessThan(1);
    }
  });

  it('contains all 13 geography knowledge components', () => {
    const keys = Object.keys(DEFAULT_BKT_PARAMS);
    expect(keys).toHaveLength(13);
  });
});
