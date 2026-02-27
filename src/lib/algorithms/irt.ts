/**
 * IRT 3-Parameter Logistic (3PL) Model
 * Replaces Elo rating system per ADR-003 and ADR-004
 *
 * Model: P(correct | θ) = c + (1 - c) / (1 + exp(-1.7 * a * (θ - b)))
 *
 * Parameters:
 *   θ (theta) — learner ability (logit scale, mean=0, SD=1)
 *   a         — item discrimination (typically 0.5–2.0)
 *   b         — item difficulty (logit scale, same as θ)
 *   c         — pseudo-guessing parameter (fixed at 0.25 for 4-option MCQ)
 *
 * References:
 *   Lord, F.M. (1980). Applications of item response theory to practical
 *     testing problems. Erlbaum.
 *   Pelánek, R. (2016). Applications of the Elo rating system in adaptive
 *     educational systems. Computers & Education, 98, 169-179.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default starting ability — derived from self-pilot EAP (26/02/2026) */
export const THETA_INITIAL = -0.780;

/** Posterior SD from self-pilot — used to seed prior width */
export const THETA_INITIAL_SD = 0.543;

/** Scaling constant (Lord, 1980) — approximates normal ogive */
const D = 1.7;

/** Fixed guessing parameter for all 4-option MCQ items */
const C_DEFAULT = 0.25;

/** Mastery threshold — Ritter et al. (2016) empirically validated */
const MASTERY_PROBABILITY = 0.8;

/** EAP grid range and resolution */
const THETA_MIN = -4;
const THETA_MAX = 4;
const THETA_STEPS = 161; // -4 to +4 in steps of 0.05

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IRTParams {
  a: number; // discrimination
  b: number; // difficulty (logits)
  c: number; // guessing (fixed 0.25)
}

export interface IRTQuestion extends IRTParams {
  id: string;
  text: string;
  options: Record<string, string>;
  correct: string;
  bloom: 1 | 2 | 3;
  kc: string; // knowledge component
}

export interface LearnerState {
  theta: number;       // current ability estimate (logits)
  thetaSd: number;     // posterior standard deviation
  responseHistory: ResponseRecord[];
}

export interface ResponseRecord {
  questionId: string;
  isCorrect: boolean;
  timestamp: number;
  theta_before: number;
  theta_after: number;
}

export interface EAPResult {
  theta: number;
  sd: number;
  ci95Low: number;
  ci95High: number;
}

export interface NextQuestionCriteria {
  targetTheta: number;   // serve item near this difficulty
  excludeIds: string[];  // already answered
  bloomLevel?: 1 | 2 | 3;
}

// ─── Core IRT Functions ───────────────────────────────────────────────────────

/**
 * 3PL probability of correct response given learner ability θ
 */
export function p3PL(theta: number, params: IRTParams): number {
  const { a, b, c } = params;
  return c + (1 - c) / (1 + Math.exp(-D * a * (theta - b)));
}

/**
 * Item Information Function — how much information item provides at θ
 * Higher = more precise ability estimation at this point
 */
export function itemInformation(theta: number, params: IRTParams): number {
  const { a, c } = params;
  const p = p3PL(theta, params);
  // Lord (1980) eq. 6.19
  return (D ** 2 * a ** 2 * ((p - c) ** 2)) / ((1 - c) ** 2 * p * (1 - p));
}

/**
 * Expected A Posteriori (EAP) ability estimation
 * Updates learner θ after each response using Bayesian posterior
 *
 * @param responses  Array of {params, isCorrect} for all answered items
 * @param priorMean  Prior mean (default THETA_INITIAL)
 * @param priorSd    Prior SD (default THETA_INITIAL_SD)
 */
export function eapEstimate(
  responses: Array<{ params: IRTParams; isCorrect: boolean }>,
  priorMean: number = THETA_INITIAL,
  priorSd: number = THETA_INITIAL_SD
): EAPResult {
  // Build θ grid
  const step = (THETA_MAX - THETA_MIN) / (THETA_STEPS - 1);
  const grid = Array.from({ length: THETA_STEPS }, (_, i) => THETA_MIN + i * step);

  // Prior: normal distribution
  const prior = grid.map((t) =>
    Math.exp(-0.5 * ((t - priorMean) / priorSd) ** 2)
  );

  // Likelihood: product of P(response | θ) for each item
  const likelihood = grid.map((theta, i) => {
    return responses.reduce((acc, { params, isCorrect }) => {
      const p = p3PL(theta, params);
      return acc * (isCorrect ? p : 1 - p);
    }, prior[i]);
  });

  // Normalise posterior
  const sum = likelihood.reduce((a, b) => a + b, 0);
  const posterior = likelihood.map((l) => l / sum);

  // EAP = weighted mean
  const theta = grid.reduce((acc, t, i) => acc + t * posterior[i], 0);

  // Posterior SD
  const sd = Math.sqrt(
    grid.reduce((acc, t, i) => acc + (t - theta) ** 2 * posterior[i], 0)
  );

  // 95% credible interval
  let cumulative = 0;
  let ci95Low = THETA_MIN;
  let ci95High = THETA_MAX;
  for (let i = 0; i < grid.length; i++) {
    cumulative += posterior[i];
    if (cumulative >= 0.025 && ci95Low === THETA_MIN) ci95Low = grid[i];
    if (cumulative >= 0.975 && ci95High === THETA_MAX) {
      ci95High = grid[i];
      break;
    }
  }

  return { theta, sd, ci95Low, ci95High };
}

// ─── Adaptive Question Selection ──────────────────────────────────────────────

/**
 * Select next question using maximum information criterion
 * Serves item that provides most information at current learner θ
 *
 * @param questions  Full question bank
 * @param criteria   Current θ and exclusion list
 */
export function selectNextQuestion(
  questions: IRTQuestion[],
  criteria: NextQuestionCriteria
): IRTQuestion | null {
  const eligible = questions.filter(
    (q) =>
      !criteria.excludeIds.includes(q.id) &&
      (criteria.bloomLevel === undefined || q.bloom === criteria.bloomLevel)
  );

  if (eligible.length === 0) return null;

  // Score each eligible item by information at current θ
  const scored = eligible.map((q) => ({
    question: q,
    info: itemInformation(criteria.targetTheta, q),
  }));

  // Return item with maximum information
  scored.sort((a, b) => b.info - a.info);
  return scored[0].question;
}

// ─── Mastery Check ────────────────────────────────────────────────────────────

/**
 * Check if learner has mastered a knowledge component
 * Mastery = P(correct) >= 0.80 at current θ for all KC items
 * Based on Ritter et al. (2016) 80% threshold
 */
export function checkMastery(
  theta: number,
  kcItems: IRTParams[]
): boolean {
  if (kcItems.length === 0) return false;
  const avgProbability =
    kcItems.reduce((sum, item) => sum + p3PL(theta, item), 0) / kcItems.length;
  return avgProbability >= MASTERY_PROBABILITY;
}

/**
 * Get human-readable difficulty band from b parameter
 * Maps logit scale to descriptive labels
 */
export function getDifficultyLabel(b: number): string {
  if (b < -1.0) return 'Very Easy';
  if (b < -0.3) return 'Easy';
  if (b < 0.3)  return 'Moderate';
  if (b < 1.0)  return 'Hard';
  return 'Very Hard';
}

/**
 * Initialise a new learner state with self-pilot derived priors
 */
export function initialiseLearner(): LearnerState {
  return {
    theta: THETA_INITIAL,
    thetaSd: THETA_INITIAL_SD,
    responseHistory: [],
  };
}

/**
 * Update learner state after a response
 * Returns new state — does not mutate input
 */
export function updateLearnerState(
  state: LearnerState,
  question: IRTQuestion,
  isCorrect: boolean,
  allResponses: Array<{ params: IRTParams; isCorrect: boolean }>
): LearnerState {
  const eap = eapEstimate(allResponses);

  const record: ResponseRecord = {
    questionId: question.id,
    isCorrect,
    timestamp: Date.now(),
    theta_before: state.theta,
    theta_after: eap.theta,
  };

  return {
    theta: eap.theta,
    thetaSd: eap.sd,
    responseHistory: [...state.responseHistory, record],
  };
}