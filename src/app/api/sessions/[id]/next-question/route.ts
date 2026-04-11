/**
 * GET /api/sessions/[id]/next-question
 * Selects the next question using IRT maximum information criterion
 * v2: Draws from QuestionTemplate + QuestionVariant (isomorphic variation)
 * Implements: Isomorphic Variation, Successive Relearning
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { selectNextQuestion, itemInformation } from '@/lib/algorithms/irt';
import type { IRTQuestion } from '@/lib/algorithms/irt';
import type { KCState } from '@/lib/algorithms/bkt';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fisher-Yates shuffle */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Safely parse the session kcStates JSON into a Record<kcId, KCState> */
function parseKcStates(raw: string | null | undefined): Record<string, KCState> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, KCState>;
    }
  } catch {
    // fall through
  }
  return {};
}

/** Replace {variable} placeholders in template text */
function renderText(templateText: string, variables: Record<string, string>): string {
  let text = templateText;
  for (const [key, value] of Object.entries(variables)) {
    text = text.replace(new RegExp('\\{' + key + '\\}', 'g'), value);
  }
  return text;
}

/** Build shuffled A/B/C/D options from variant, return options map + correct label */
function buildOptions(
  correctAnswer: string,
  distractors: string[]
): { options: Record<string, string>; correctLabel: string } {
  const pool = shuffleArray([correctAnswer, ...distractors.slice(0, 3)]);
  const labels = ['A', 'B', 'C', 'D'];
  const options: Record<string, string> = {};
  pool.forEach((text, i) => {
    options[labels[i]] = text;
  });
  const correctIdx = pool.indexOf(correctAnswer);
  const correctLabel = correctIdx >= 0 ? labels[correctIdx] : 'A';
  return { options, correctLabel };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    // Load session (needed for early-exit checks)
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.completedAt) {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
    }

    // -------------------------------------------------------------------
    // Parallel fetch: all independent queries at once
    // -------------------------------------------------------------------
    const [presentations, templates, kcMasteries, prerequisites, userVariantsSeen] = await Promise.all([
      prisma.variantPresentation.findMany({
        where: { sessionId },
        select: { variantId: true },
      }),
      prisma.questionTemplate.findMany({
        include: { variants: true },
      }),
      prisma.kCMastery.findMany({
        where: { sessionId },
      }),
      prisma.prerequisiteEdge.findMany(),
      // Cross-session dedup: all variants this user has ever seen
      prisma.userVariantSeen.findMany({
        where: { userId: session.userId },
        select: { variantId: true },
      }),
    ]);

    const presentedVariantIds = new Set(presentations.map((p) => p.variantId));
    const seenVariantIds = new Set(userVariantsSeen.map((v) => v.variantId));

    if (templates.length === 0) {
      return serveStaticQuestion(session, sessionId);
    }

    // KCs that were mastered but have decayed below re-engagement threshold
    const decayedKCIds = new Set(
      kcMasteries
        .filter((m) => m.masteredAt !== null && m.pLearned < 0.6)
        .map((m) => m.kcId)
    );

    // Mastery lookup: KCMastery rows are updated as the learner answers, but on
    // a cold session they do not exist yet. We fall back to the in-session
    // `kcStates` JSON which is seeded from BKT priors at session creation so
    // prerequisite gating never starts from zero. KCMastery values always win
    // when both sources disagree (they reflect the latest answer updates).
    const sessionKcStates: Record<string, KCState> =
      parseKcStates(session.kcStates);
    const masteryMap = new Map<string, number>();
    for (const [kcId, state] of Object.entries(sessionKcStates)) {
      masteryMap.set(kcId, state.pLearned);
    }
    for (const m of kcMasteries) {
      masteryMap.set(m.kcId, m.pLearned);
    }

    function kcIsAccessible(kcId: string): boolean {
      const reqs = prerequisites.filter((p) => p.toKCId === kcId);
      if (reqs.length === 0) return true; // no prerequisites
      // 0.5 selection threshold so L2 / L3 unlock after the learner starts
      // showing mastery of any prerequisite. We use `some` rather than `every`
      // so a single satisfied prerequisite is enough to expose the dependent
      // KC, which prevents cold-start lockout while still respecting the
      // dependency graph for question selection. Full mastery gating (0.8)
      // remains enforced separately at the KC mastery reporting layer.
      const SELECTION_THRESHOLD = 0.5;
      return reqs.some((p) => (masteryMap.get(p.fromKCId) ?? 0) >= SELECTION_THRESHOLD);
    }

    // -------------------------------------------------------------------
    // Build IRTQuestion candidates from templates
    // -------------------------------------------------------------------
    // A template is eligible if it has at least one unseen variant
    const candidates: Array<IRTQuestion & { templateId: string; eligibleVariantIds: string[] }> = [];

    // Track whether any template was excluded solely due to cross-session dedup
    let crossSessionPoolExhausted = false;

    for (const template of templates) {
      // Session-level filter: not already answered this session
      const notThisSession = template.variants.filter(
        (v) => !presentedVariantIds.has(v.id)
      );
      if (notThisSession.length === 0) continue;

      // Skip KCs whose prerequisites are not yet mastered
      if (!kcIsAccessible(template.kcId)) continue;

      // Cross-session filter: prefer unseen variants; fall back to seen ones
      const freshVariants = notThisSession.filter((v) => !seenVariantIds.has(v.id));
      const eligibleVariantIds = freshVariants.length > 0
        ? freshVariants.map((v) => v.id)
        : notThisSession.map((v) => v.id); // fallback: review question

      if (freshVariants.length === 0 && notThisSession.length > 0) {
        crossSessionPoolExhausted = true;
      }

      // Boost information value for decayed KCs (successive relearning)
      const isDecayed = decayedKCIds.has(template.kcId);

      candidates.push({
        id: template.id,
        text: template.templateText, // placeholder, will be rendered from variant
        options: {},
        correct: 'A', // placeholder
        bloom: (template.bloomLevel as 1 | 2 | 3) || 1,
        kc: template.kcId,
        a: isDecayed ? template.discrimination * 1.5 : template.discrimination,
        b: template.difficulty,
        c: template.guessingParam,
        templateId: template.id,
        eligibleVariantIds,
      });
    }

    // Log when pool is exhausted for analytics traceability
    if (crossSessionPoolExhausted) {
      prisma.analyticsEvent
        .create({
          data: {
            sessionId,
            eventType: 'variant_pool_exhausted',
            payload: { userId: session.userId, totalSeen: seenVariantIds.size },
          },
        })
        .catch(() => {});
    }

    // -------------------------------------------------------------------
    // Check completion: no eligible candidates left
    // -------------------------------------------------------------------
    const totalPresentations = presentations.length;
    const TARGET_QUESTIONS = 15; // concise sessions for replayability

    if (candidates.length === 0 || totalPresentations >= TARGET_QUESTIONS) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { completedAt: new Date() },
      });
      return NextResponse.json({
        completed: true,
        message: 'Session complete',
        finalTheta: session.theta,
        totalAnswered: totalPresentations,
      });
    }

    // -------------------------------------------------------------------
    // Bloom-level progression policy (fixes L1 lock-in bug)
    // Instead of pure IRT maximum information (which keeps weak learners
    // stuck on easy items), we enforce progression with challenge gates:
    //   Q1-4:  Bloom 1-2 (establish baseline, mix difficulty)
    //   Q5-9:  Prefer Bloom 2, inject Bloom 3 challenges
    //   Q10+:  Full IRT-driven range, prefer higher bloom
    // If learner aces higher-bloom, immediately unlock. If fail, drop back.
    // -------------------------------------------------------------------
    const recentResults = await prisma.interaction.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { isCorrect: true },
    });
    const recentCorrectRate = recentResults.length > 0
      ? recentResults.filter(r => r.isCorrect).length / recentResults.length
      : 0.5;

    let maxBloom = 3;
    let minBloom = 1;
    if (totalPresentations < 4) {
      maxBloom = recentCorrectRate >= 0.8 ? 3 : 2;
      minBloom = 1;
    } else if (totalPresentations < 9) {
      minBloom = recentCorrectRate >= 0.6 ? 2 : 1;
      maxBloom = 3;
    } else {
      minBloom = recentCorrectRate >= 0.7 ? 2 : 1;
    }

    // Filter candidates by bloom progression range
    const bloomFiltered = candidates.filter(c => c.bloom >= minBloom && c.bloom <= maxBloom);
    const finalCandidates = bloomFiltered.length > 0 ? bloomFiltered : candidates;

    // -------------------------------------------------------------------
    // IRT selection (on bloom-filtered candidates)
    // -------------------------------------------------------------------
    let selectedCandidate: typeof candidates[0] | null = null;

    if (session.condition === 'adaptive') {
      const selected = selectNextQuestion(finalCandidates, {
        targetTheta: session.theta,
        excludeIds: [],
      });
      selectedCandidate = finalCandidates.find((c) => c.id === selected?.id) || finalCandidates[0];
    } else {
      const sorted = [...finalCandidates].sort((a, b) => a.b - b.b);
      selectedCandidate = sorted[0];
    }

    if (!selectedCandidate) {
      return NextResponse.json({ error: 'No eligible questions remaining' }, { status: 404 });
    }

    // -------------------------------------------------------------------
    // Pick a random unseen variant and render it
    // -------------------------------------------------------------------
    const shuffledVariantIds = shuffleArray(selectedCandidate.eligibleVariantIds);
    const chosenVariantId = shuffledVariantIds[0];

    const chosenVariant = await prisma.questionVariant.findUnique({
      where: { id: chosenVariantId },
    });

    if (!chosenVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    const variables = (chosenVariant.variables as Record<string, string>) || {};
    const renderedText = renderText(selectedCandidate.text, variables);

    const distractorsRaw = chosenVariant.distractors;
    const distractors: string[] = Array.isArray(distractorsRaw)
      ? (distractorsRaw as string[])
      : Object.values(distractorsRaw as Record<string, string>);

    const { options, correctLabel } = buildOptions(chosenVariant.correctAnswer, distractors);

    // -------------------------------------------------------------------
    // Log VariantPresentation (for Isomorphic Variation tracking) and
    // an AnalyticsEvent capturing the bloom level, kc, and theta at the
    // point of selection. The analytics event is what lets us prove in the
    // viva that the engine actually escalated across the session.
    // -------------------------------------------------------------------
    await prisma.variantPresentation.create({
      data: {
        variantId: chosenVariantId,
        sessionId,
        format: 'mc',
        presentedAt: new Date(),
      },
    });

    prisma.analyticsEvent
      .create({
        data: {
          sessionId,
          eventType: 'bloom_escalation',
          payload: {
            bloom: selectedCandidate.bloom,
            kcId: selectedCandidate.kc,
            templateId: selectedCandidate.templateId,
            theta: session.theta,
            questionIndex: totalPresentations + 1,
          },
        },
      })
      .catch((err: unknown) => console.warn('bloom_escalation log failed:', err));

    // -------------------------------------------------------------------
    // Calculate information value at current theta
    // -------------------------------------------------------------------
    const infoAtTheta = itemInformation(session.theta, selectedCandidate);

    // -------------------------------------------------------------------
    // Return rendered question
    // NOTE: variantId is returned as questionId - answer route handles both
    // -------------------------------------------------------------------
    return NextResponse.json({
      questionId: chosenVariantId,       // variant ID - answer route detects this
      templateId: selectedCandidate.templateId,
      text: renderedText,
      options,
      bloom: selectedCandidate.bloom,
      kc: selectedCandidate.kc,
      meta: {
        currentTheta: session.theta,
        itemDifficulty: selectedCandidate.b,
        itemInformation: Math.round(infoAtTheta * 1000) / 1000,
        questionsAnswered: totalPresentations,
        questionsRemaining: Math.max(0, TARGET_QUESTIONS - totalPresentations - 1),
        isLastQuestion: totalPresentations + 1 >= TARGET_QUESTIONS,
        condition: session.condition,
        isVariant: true,
        isReview: seenVariantIds.has(chosenVariantId), // true = user has seen this before
      },
    });

  } catch (error) {
    console.error('GET /api/sessions/[id]/next-question error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Fallback: serve static questions if no templates exist
// ---------------------------------------------------------------------------
async function serveStaticQuestion(
  session: { id: string; quizId: string; theta: number; condition: string; completedAt: Date | null },
  sessionId: string
) {
  const prismaClient = prisma;

  const questions = await prismaClient.question.findMany({
    where: { quizId: session.quizId },
    include: { options: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  });

  const interactions = await prismaClient.interaction.findMany({
    where: { sessionId },
    select: { questionId: true },
  });

  const answeredIds = interactions.map((i) => i.questionId);

  if (answeredIds.length >= questions.length) {
    await prismaClient.session.update({
      where: { id: sessionId },
      data: { completedAt: new Date() },
    });
    return NextResponse.json({
      completed: true,
      message: 'Session complete',
      finalTheta: session.theta,
      totalAnswered: answeredIds.length,
    });
  }

  const labels = ['A', 'B', 'C', 'D'];
  const irtQuestions: IRTQuestion[] = questions.map((q) => {
    const optionsMap: Record<string, string> = {};
    q.options.forEach((opt, idx) => {
      if (idx < 4) optionsMap[labels[idx]] = opt.text;
    });
    const correctIdx = q.options.findIndex((o) => o.isCorrect);
    return {
      id: q.id,
      text: q.text,
      options: optionsMap,
      correct: correctIdx >= 0 ? labels[correctIdx] : 'A',
      bloom: (q.bloom as 1 | 2 | 3) || 1,
      kc: q.kc || '',
      a: q.irt_a,
      b: q.irt_b,
      c: q.irt_c,
    };
  });

  const { selectNextQuestion, itemInformation } = await import('@/lib/algorithms/irt');

  let selected: IRTQuestion | null = null;
  if (session.condition === 'adaptive') {
    selected = selectNextQuestion(irtQuestions, { targetTheta: session.theta, excludeIds: answeredIds });
  } else {
    selected = irtQuestions.filter((q) => !answeredIds.includes(q.id))[0] || null;
  }

  if (!selected) {
    return NextResponse.json({ error: 'No eligible questions remaining' }, { status: 404 });
  }

  const info = itemInformation(session.theta, selected);
  return NextResponse.json({
    questionId: selected.id,
    text: selected.text,
    options: selected.options,
    bloom: selected.bloom,
    kc: selected.kc,
    meta: {
      currentTheta: session.theta,
      itemDifficulty: selected.b,
      itemInformation: Math.round(info * 1000) / 1000,
      questionsAnswered: answeredIds.length,
      questionsRemaining: questions.length - answeredIds.length,
      condition: session.condition,
      isVariant: false,
    },
  });
}
