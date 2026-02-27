 /**
 * POST /api/sessions/[id]/answer
 * Submits a learner's answer and updates:
 *   1. IRT ability estimate (θ) via EAP
 *   2. BKT knowledge component state for the answered item's KC
 *   3. Interaction record (full audit trail for dissertation analysis)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { eapEstimate } from '@/lib/algorithms/irt';
import type { IRTParams } from '@/lib/algorithms/irt';
import { updateKCState, DEFAULT_BKT_PARAMS } from '@/lib/algorithms/bkt';
import type { KCState } from '@/lib/algorithms/bkt';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const body = await req.json();
    const { questionId, selectedAnswer, responseTimeMs } = body;

    // Validate required fields
    if (!questionId || !selectedAnswer) {
      return NextResponse.json(
        { error: 'questionId and selectedAnswer are required' },
        { status: 400 }
      );
    }

    // Load session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        interactions: {
          include: { question: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.completedAt) {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
    }

    // Load the question with options
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { options: { orderBy: { order: 'asc' } } },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check question belongs to this session's quiz
    if (question.quizId !== session.quizId) {
      return NextResponse.json(
        { error: 'Question does not belong to this session' },
        { status: 400 }
      );
    }

    // Check not already answered
    const alreadyAnswered = session.interactions.some(
      (i) => i.questionId === questionId
    );
    if (alreadyAnswered) {
      return NextResponse.json(
        { error: 'Question already answered in this session' },
        { status: 400 }
      );
    }

    // Determine correct answer
    const labels = ['A', 'B', 'C', 'D'];
    const correctIdx = question.options.findIndex((o) => o.isCorrect);
    const correctLabel = correctIdx >= 0 ? labels[correctIdx] : 'A';
    const isCorrect = selectedAnswer.toUpperCase() === correctLabel;

    // ── IRT Update (EAP) ──────────────────────────────────────────────────────

    // Build full response history including this new response
    const allResponses: Array<{ params: IRTParams; isCorrect: boolean }> = [
      // Previous responses from session interactions
      ...session.interactions.map((interaction) => ({
        params: {
          a: interaction.question.irt_a,
          b: interaction.question.irt_b,
          c: interaction.question.irt_c,
        },
        isCorrect: interaction.isCorrect,
      })),
      // This new response
      {
        params: {
          a: question.irt_a,
          b: question.irt_b,
          c: question.irt_c,
        },
        isCorrect,
      },
    ];

    const eap = eapEstimate(allResponses);
    const theta_before = session.theta;
    const theta_after = eap.theta;

    // ── BKT Update ────────────────────────────────────────────────────────────

    // Parse current KC states from session
    let kcStates: Record<string, KCState> = {};
    try {
      kcStates = JSON.parse(session.kcStates);
    } catch {
      kcStates = {};
    }

    const kc = question.kc;
    const pLearned_before = kcStates[kc]?.pLearned ?? 0.25;
    let pLearned_after = pLearned_before;

    // Update BKT state if we have params for this KC
    if (kc && DEFAULT_BKT_PARAMS[kc]) {
      const updatedKCState = updateKCState(
        kcStates[kc] || {
          kcId: kc,
          pLearned: DEFAULT_BKT_PARAMS[kc].pL0,
          attempts: 0,
          correct: 0,
          isMastered: false,
        },
        isCorrect,
        DEFAULT_BKT_PARAMS[kc]
      );
      kcStates[kc] = updatedKCState;
      pLearned_after = updatedKCState.pLearned;
    }

    // ── Persist to DB (transaction) ───────────────────────────────────────────

    const [interaction] = await prisma.$transaction([
      // Create interaction record
      prisma.interaction.create({
        data: {
          sessionId,
          questionId,
          selectedAnswer: selectedAnswer.toUpperCase(),
          isCorrect,
          responseTimeMs: responseTimeMs || 0,
          theta_before,
          theta_after,
          pLearned_before,
          pLearned_after,
        },
      }),
      // Update session theta and KC states
      prisma.session.update({
        where: { id: sessionId },
        data: {
          theta: theta_after,
          thetaSd: eap.sd,
          kcStates: JSON.stringify(kcStates),
        },
      }),
    ]);

    // ── Response ──────────────────────────────────────────────────────────────

    return NextResponse.json({
      correct: isCorrect,
      correctAnswer: correctLabel,
      selectedAnswer: selectedAnswer.toUpperCase(),
      // IRT update
      theta: {
        before: Math.round(theta_before * 1000) / 1000,
        after: Math.round(theta_after * 1000) / 1000,
        delta: Math.round((theta_after - theta_before) * 1000) / 1000,
        sd: Math.round(eap.sd * 1000) / 1000,
        ci95: [
          Math.round(eap.ci95Low * 1000) / 1000,
          Math.round(eap.ci95High * 1000) / 1000,
        ],
      },
      // BKT update for this KC
      bkt: {
        kc,
        pLearned_before: Math.round(pLearned_before * 1000) / 1000,
        pLearned_after: Math.round(pLearned_after * 1000) / 1000,
        isMastered: kcStates[kc]?.isMastered ?? false,
      },
      interactionId: interaction.id,
    });

  } catch (error) {
    console.error('POST /api/sessions/[id]/answer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}