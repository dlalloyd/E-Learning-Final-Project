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

    // Load session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { interactions: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.completedAt) {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
    }

    // -------------------------------------------------------------------
    // Get already-presented variant IDs for this session
    // -------------------------------------------------------------------
    const presentations = await prisma.variantPresentation.findMany({
      where: { sessionId },
      select: { variantId: true },
    });
    const presentedVariantIds = new Set(presentations.map((p) => p.variantId));

    // -------------------------------------------------------------------
    // Load all question templates with their variants
    // -------------------------------------------------------------------
    const templates = await prisma.questionTemplate.findMany({
      include: { variants: true },
    });

    if (templates.length === 0) {
      // Fallback: no templates exist, serve static questions
      return serveStaticQuestion(session, sessionId);
    }

    // -------------------------------------------------------------------
    // Successive Relearning: check for decayed KCs
    // -------------------------------------------------------------------
    const kcMasteries = await prisma.kCMastery.findMany({
      where: { sessionId },
    });

    // KCs that were mastered but have decayed below re-engagement threshold
    const decayedKCIds = new Set(
      kcMasteries
        .filter((m) => m.masteredAt !== null && m.pLearned < 0.6)
        .map((m) => m.kcId)
    );

    // -------------------------------------------------------------------
    // Prerequisite Gating: build set of accessible KC IDs
    // -------------------------------------------------------------------
    const prerequisites = await prisma.prerequisiteEdge.findMany();
    const masteryMap = new Map(kcMasteries.map((m) => [m.kcId, m.pLearned]));

    function kcIsAccessible(kcId: string): boolean {
      const reqs = prerequisites.filter((p) => p.toKCId === kcId);
      if (reqs.length === 0) return true; // no prerequisites — always accessible
      return reqs.every((p) => (masteryMap.get(p.fromKCId) ?? 0) >= p.masteryThreshold);
    }

    // -------------------------------------------------------------------
    // Build IRTQuestion candidates from templates
    // -------------------------------------------------------------------
    // A template is eligible if it has at least one unseen variant
    const candidates: Array<IRTQuestion & { templateId: string; eligibleVariantIds: string[] }> = [];

    for (const template of templates) {
      const unseenVariants = template.variants.filter(
        (v) => !presentedVariantIds.has(v.id)
      );
      if (unseenVariants.length === 0) continue;

      // Skip KCs whose prerequisites are not yet mastered
      if (!kcIsAccessible(template.kcId)) continue;

      // Boost information value for decayed KCs (successive relearning)
      const isDecayed = decayedKCIds.has(template.kcId);

      candidates.push({
        id: template.id,
        text: template.templateText, // placeholder — will be rendered from variant
        options: {},
        correct: 'A', // placeholder
        bloom: (template.bloomLevel as 1 | 2 | 3) || 1,
        kc: template.kcId,
        a: isDecayed ? template.discrimination * 1.5 : template.discrimination,
        b: template.difficulty,
        c: template.guessingParam,
        templateId: template.id,
        eligibleVariantIds: unseenVariants.map((v) => v.id),
      });
    }

    // -------------------------------------------------------------------
    // Check completion: no eligible candidates left
    // -------------------------------------------------------------------
    const totalPresentations = presentations.length;
    const TARGET_QUESTIONS = 27; // match original session length

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
    // IRT selection
    // -------------------------------------------------------------------
    let selectedCandidate: typeof candidates[0] | null = null;

    if (session.condition === 'adaptive') {
      // Maximum information criterion at current theta
      const selected = selectNextQuestion(candidates, {
        targetTheta: session.theta,
        excludeIds: [], // candidates already filtered
      });
      selectedCandidate = candidates.find((c) => c.id === selected?.id) || candidates[0];
    } else {
      // STATIC: fixed order by difficulty
      const sorted = [...candidates].sort((a, b) => a.b - b.b);
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
    // Log VariantPresentation (for Isomorphic Variation tracking)
    // -------------------------------------------------------------------
    await prisma.variantPresentation.create({
      data: {
        variantId: chosenVariantId,
        sessionId,
        format: 'mc',
        presentedAt: new Date(),
      },
    });

    // -------------------------------------------------------------------
    // Calculate information value at current theta
    // -------------------------------------------------------------------
    const infoAtTheta = itemInformation(session.theta, selectedCandidate);

    // -------------------------------------------------------------------
    // Return rendered question
    // NOTE: variantId is returned as questionId — answer route handles both
    // -------------------------------------------------------------------
    return NextResponse.json({
      questionId: chosenVariantId,       // variant ID — answer route detects this
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
        questionsRemaining: Math.max(0, TARGET_QUESTIONS - totalPresentations),
        condition: session.condition,
        isVariant: true,
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
