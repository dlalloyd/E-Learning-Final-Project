/**
 * IRT 3PL Model — Unit Tests
 *
 * Validates:
 *   - 3PL probability formula (Lord, 1980)
 *   - Item Information Function
 *   - EAP ability estimation (Bayesian posterior)
 *   - Adaptive question selection (maximum information criterion)
 *   - Mastery check
 *   - Learner state management
 *   - estimateThetaFromAssessment
 */

import {
  p3PL,
  itemInformation,
  eapEstimate,
  selectNextQuestion,
  checkMastery,
  initialiseLearner,
  updateLearnerState,
  estimateThetaFromAssessment,
  getDifficultyLabel,
  THETA_INITIAL,
  THETA_INITIAL_SD,
  type IRTParams,
  type IRTQuestion,
} from '../src/lib/algorithms/irt';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TYPICAL_ITEM: IRTParams = { a: 1.0, b: 0.0, c: 0.25 };

const QUESTION_BANK: IRTQuestion[] = [
  { id: 'q1', a: 1.0, b: -1.0, c: 0.25, bloom: 1, kc: 'UK_county_locations', text: 'Q1', options: {}, correct: 'A' },
  { id: 'q2', a: 1.2, b:  0.0, c: 0.25, bloom: 2, kc: 'westerly_winds_rainfall', text: 'Q2', options: {}, correct: 'B' },
  { id: 'q3', a: 0.8, b:  1.0, c: 0.25, bloom: 3, kc: 'climate_classification', text: 'Q3', options: {}, correct: 'C' },
  { id: 'q4', a: 1.5, b: -0.5, c: 0.25, bloom: 1, kc: 'UK_county_locations', text: 'Q4', options: {}, correct: 'A' },
];

// ─── p3PL ─────────────────────────────────────────────────────────────────────

describe('p3PL', () => {
  it('returns guessing parameter c when learner ability is far below item difficulty', () => {
    const p = p3PL(-10, TYPICAL_ITEM);
    expect(p).toBeCloseTo(0.25, 3);
  });

  it('returns close to 1 when learner ability is far above item difficulty', () => {
    const p = p3PL(10, TYPICAL_ITEM);
    expect(p).toBeCloseTo(1.0, 3);
  });

  it('returns 0.625 at theta == b (midpoint) for c=0.25, a=1', () => {
    // P = c + (1-c)/2 = 0.25 + 0.375 = 0.625 at θ=b
    const p = p3PL(0.0, TYPICAL_ITEM);
    expect(p).toBeCloseTo(0.625, 3);
  });

  it('probability is monotonically increasing with theta', () => {
    const thetas = [-3, -2, -1, 0, 1, 2, 3];
    const probs = thetas.map((t) => p3PL(t, TYPICAL_ITEM));
    for (let i = 1; i < probs.length; i++) {
      expect(probs[i]).toBeGreaterThan(probs[i - 1]);
    }
  });

  it('is bounded by [c, 1]', () => {
    for (let theta = -5; theta <= 5; theta += 0.5) {
      const p = p3PL(theta, TYPICAL_ITEM);
      expect(p).toBeGreaterThanOrEqual(0.25);
      expect(p).toBeLessThanOrEqual(1.0);
    }
  });

  it('higher discrimination (a) produces steeper curve around b', () => {
    const lowA:  IRTParams = { a: 0.5, b: 0, c: 0.25 };
    const highA: IRTParams = { a: 2.0, b: 0, c: 0.25 };
    // At theta=1 (1 logit above b), high-a item should yield higher P
    expect(p3PL(1, highA)).toBeGreaterThan(p3PL(1, lowA));
    // At theta=-1, high-a item should yield lower P
    expect(p3PL(-1, highA)).toBeLessThan(p3PL(-1, lowA));
  });
});

// ─── itemInformation ──────────────────────────────────────────────────────────

describe('itemInformation', () => {
  it('returns positive information for any theta', () => {
    for (let theta = -3; theta <= 3; theta += 0.5) {
      expect(itemInformation(theta, TYPICAL_ITEM)).toBeGreaterThan(0);
    }
  });

  it('is higher at item difficulty b than far below b', () => {
    // The 3PL IIF (Lord, 1980 eq. 6.19) is very low when θ << b (probability
    // collapses to the guessing parameter c, so (p-c)² → 0).
    const infoAtB    = itemInformation(0.0,  TYPICAL_ITEM);
    const infoFarBelow = itemInformation(-3.0, TYPICAL_ITEM);
    expect(infoAtB).toBeGreaterThan(infoFarBelow);
  });

  it('higher discrimination yields more information at the peak', () => {
    const lowA:  IRTParams = { a: 0.5, b: 0, c: 0.25 };
    const highA: IRTParams = { a: 2.0, b: 0, c: 0.25 };
    expect(itemInformation(0, highA)).toBeGreaterThan(itemInformation(0, lowA));
  });
});

// ─── eapEstimate ──────────────────────────────────────────────────────────────

describe('eapEstimate', () => {
  it('returns prior mean when no responses given', () => {
    const result = eapEstimate([]);
    expect(result.theta).toBeCloseTo(THETA_INITIAL, 2);
  });

  it('theta increases after a correct response on an easy item', () => {
    const easyItem: IRTParams = { a: 1.0, b: -1.5, c: 0.25 };
    const before = eapEstimate([]).theta;
    const after  = eapEstimate([{ params: easyItem, isCorrect: true }]).theta;
    expect(after).toBeGreaterThan(before);
  });

  it('theta decreases after an incorrect response on a hard item', () => {
    const hardItem: IRTParams = { a: 1.0, b: 1.5, c: 0.25 };
    const before = eapEstimate([]).theta;
    const after  = eapEstimate([{ params: hardItem, isCorrect: false }]).theta;
    expect(after).toBeLessThan(before);
  });

  it('returns a 95% CI with low < theta < high', () => {
    const result = eapEstimate([{ params: TYPICAL_ITEM, isCorrect: true }]);
    expect(result.ci95Low).toBeLessThan(result.theta);
    expect(result.ci95High).toBeGreaterThan(result.theta);
  });

  it('posterior SD narrows with more responses', () => {
    const responses = Array.from({ length: 10 }, (_, i) => ({
      params: { a: 1.0, b: (i % 3) - 1, c: 0.25 } as IRTParams,
      isCorrect: i % 2 === 0,
    }));
    const few  = eapEstimate(responses.slice(0, 2));
    const many = eapEstimate(responses);
    expect(many.sd).toBeLessThan(few.sd);
  });

  it('accumulated correct responses push theta well above prior', () => {
    const allCorrect = Array.from({ length: 8 }, () => ({
      params: TYPICAL_ITEM,
      isCorrect: true,
    }));
    const result = eapEstimate(allCorrect);
    expect(result.theta).toBeGreaterThan(THETA_INITIAL);
  });
});

// ─── selectNextQuestion ───────────────────────────────────────────────────────

describe('selectNextQuestion', () => {
  it('returns null when question bank is empty', () => {
    const q = selectNextQuestion([], { targetTheta: 0, excludeIds: [] });
    expect(q).toBeNull();
  });

  it('returns null when all questions are excluded', () => {
    const q = selectNextQuestion(QUESTION_BANK, {
      targetTheta: 0,
      excludeIds: QUESTION_BANK.map((q) => q.id),
    });
    expect(q).toBeNull();
  });

  it('does not return excluded questions', () => {
    const q = selectNextQuestion(QUESTION_BANK, {
      targetTheta: 0,
      excludeIds: ['q1', 'q2'],
    });
    expect(q).not.toBeNull();
    expect(['q1', 'q2']).not.toContain(q!.id);
  });

  it('filters by bloom level when specified', () => {
    const q = selectNextQuestion(QUESTION_BANK, {
      targetTheta: 0,
      excludeIds: [],
      bloomLevel: 3,
    });
    expect(q).not.toBeNull();
    expect(q!.bloom).toBe(3);
  });

  it('selects item with highest information at current theta', () => {
    // At theta=0, the selection should match the item with maximum itemInformation(0, ...)
    // q4 (a=1.5, b=-0.5) provides more information at theta=0 than q2 (a=1.2, b=0)
    // because its higher discrimination a dominates over b proximity in the 3PL IIF.
    const q = selectNextQuestion(QUESTION_BANK, { targetTheta: 0, excludeIds: [] });
    expect(q).not.toBeNull();
    // Verify the chosen item genuinely maximises information
    const chosenInfo = itemInformation(0, q!);
    for (const other of QUESTION_BANK) {
      if (other.id !== q!.id) {
        expect(chosenInfo).toBeGreaterThanOrEqual(itemInformation(0, other));
      }
    }
  });

  it('returns null when bloom filter matches no remaining questions', () => {
    const q = selectNextQuestion(QUESTION_BANK, {
      targetTheta: 0,
      excludeIds: ['q3'],
      bloomLevel: 3,
    });
    expect(q).toBeNull();
  });
});

// ─── checkMastery ─────────────────────────────────────────────────────────────

describe('checkMastery', () => {
  it('returns false when kcItems is empty', () => {
    expect(checkMastery(2.0, [])).toBe(false);
  });

  it('returns true when high-ability learner faces easy items', () => {
    const easyItems: IRTParams[] = [
      { a: 1.0, b: -2.0, c: 0.25 },
      { a: 1.0, b: -2.5, c: 0.25 },
    ];
    expect(checkMastery(2.0, easyItems)).toBe(true);
  });

  it('returns false when low-ability learner faces hard items', () => {
    const hardItems: IRTParams[] = [
      { a: 1.0, b: 2.0, c: 0.25 },
      { a: 1.0, b: 2.5, c: 0.25 },
    ];
    expect(checkMastery(-2.0, hardItems)).toBe(false);
  });
});

// ─── getDifficultyLabel ───────────────────────────────────────────────────────

describe('getDifficultyLabel', () => {
  it.each([
    [-2.0, 'Very Easy'],
    [-0.6, 'Easy'],
    [ 0.0, 'Moderate'],
    [ 0.7, 'Hard'],
    [ 1.5, 'Very Hard'],
  ])('b=%f → %s', (b, expected) => {
    expect(getDifficultyLabel(b)).toBe(expected);
  });
});

// ─── estimateThetaFromAssessment ──────────────────────────────────────────────

describe('estimateThetaFromAssessment', () => {
  it('returns THETA_INITIAL when total is zero', () => {
    expect(estimateThetaFromAssessment(0, 0)).toBe(THETA_INITIAL);
  });

  it('returns a value above THETA_INITIAL for a perfect score', () => {
    expect(estimateThetaFromAssessment(13, 13)).toBeGreaterThan(THETA_INITIAL);
  });

  it('returns a value below THETA_INITIAL for a zero score', () => {
    expect(estimateThetaFromAssessment(0, 13)).toBeLessThan(THETA_INITIAL);
  });

  it('output is clamped to [-2.5, 2.5]', () => {
    const high = estimateThetaFromAssessment(100, 100);
    const low  = estimateThetaFromAssessment(0, 100);
    expect(high).toBeLessThanOrEqual(2.5);
    expect(low).toBeGreaterThanOrEqual(-2.5);
  });

  it('higher score yields higher theta', () => {
    const t10 = estimateThetaFromAssessment(10, 13);
    const t5  = estimateThetaFromAssessment(5,  13);
    expect(t10).toBeGreaterThan(t5);
  });
});

// ─── initialiseLearner & updateLearnerState ───────────────────────────────────

describe('initialiseLearner', () => {
  it('starts with THETA_INITIAL and empty history', () => {
    const state = initialiseLearner();
    expect(state.theta).toBe(THETA_INITIAL);
    expect(state.thetaSd).toBe(THETA_INITIAL_SD);
    expect(state.responseHistory).toHaveLength(0);
  });
});

describe('updateLearnerState', () => {
  const question = QUESTION_BANK[1]; // q2, b=0

  it('appends a response record to history', () => {
    const state  = initialiseLearner();
    const next   = updateLearnerState(
      state,
      question,
      true,
      [{ params: question, isCorrect: true }],
    );
    expect(next.responseHistory).toHaveLength(1);
    expect(next.responseHistory[0].questionId).toBe('q2');
    expect(next.responseHistory[0].isCorrect).toBe(true);
  });

  it('does not mutate the original state', () => {
    const state = initialiseLearner();
    updateLearnerState(state, question, true, [{ params: question, isCorrect: true }]);
    expect(state.responseHistory).toHaveLength(0);
  });

  it('theta_before and theta_after are stored correctly', () => {
    const state = initialiseLearner();
    const next  = updateLearnerState(
      state,
      question,
      true,
      [{ params: question, isCorrect: true }],
    );
    expect(next.responseHistory[0].theta_before).toBe(THETA_INITIAL);
    expect(next.responseHistory[0].theta_after).toBe(next.theta);
  });
});
