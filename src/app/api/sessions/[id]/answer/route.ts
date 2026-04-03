/**
 * POST /api/sessions/[id]/answer
 * Submits a learner's answer and updates:
 *   1. IRT ability estimate (theta) via EAP
 *   2. BKT knowledge component state
 *   3. Interaction record (audit trail)
 *   4. Confidence calibration (CBM)
 *   5. KCMastery (Successive Relearning)
 *
 * v2: Handles both QuestionVariant IDs (isomorphic) and legacy Question IDs
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
    const { questionId, selectedAnswer, responseTimeMs, confidenceLevel, cognitiveLoad, optionsMap } = body;

    if (!questionId || !selectedAnswer) {
      return NextResponse.json(
        { error: 'questionId and selectedAnswer are required' },
        { status: 400 }
      );
    }

    // Load session with full interaction history
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        interactions: {
          include: {
            question: {
              include: { options: { orderBy: { order: 'asc' } } },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.completedAt) {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
    }

    // -------------------------------------------------------------------
    // Detect whether questionId is a QuestionVariant ID or legacy Question ID
    // -------------------------------------------------------------------
    let isVariant = false;
    let kc = '';
    let correctLabel = '';
    let irtParams: IRTParams = { a: 1.0, b: 0.0, c: 0.25 };
    let questionRecord: { id: string } | null = null;

    // Try variant first
    const variant = await prisma.questionVariant.findUnique({
      where: { id: questionId },
      include: { template: true },
    });

    if (variant) {
      // --- VARIANT PATH ---
      isVariant = true;
      kc = variant.template.kcId;

      // The client sends a label (A/B/C/D) and the shuffled options map.
      // We need to find which label corresponds to the correct answer text.
      const correctAnswerText = variant.correctAnswer;
      if (optionsMap && typeof optionsMap === 'object') {
        // Find the label whose text matches the correct answer
        const matchingEntry = Object.entries(optionsMap as Record<string, string>)
          .find(([, text]) => text === correctAnswerText);
        correctLabel = matchingEntry ? matchingEntry[0].toUpperCase() : 'A';
      } else {
        // Fallback: compare answer text directly
        correctLabel = selectedAnswer.toUpperCase();
      }

      // IRT params from template (discrimination/difficulty/guessingParam)
      irtParams = {
        a: variant.template.discrimination,
        b: variant.template.difficulty,
        c: variant.template.guessingParam,
      };
      questionRecord = { id: questionId };

      const isAnswerCorrect = selectedAnswer.toUpperCase() === correctLabel;

      // Update VariantPresentation with correctness + confidence
      await prisma.variantPresentation.updateMany({
        where: { variantId: questionId, sessionId },
        data: {
          isCorrect: isAnswerCorrect,
          confidenceLevel: confidenceLevel || null,
          responseTimeMs: responseTimeMs || null,
        },
      });

    } else {
      // --- LEGACY QUESTION PATH ---
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { options: { orderBy: { order: 'asc' } } },
      });

      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
      if (question.quizId !== session.quizId) {
        return NextResponse.json({ error: 'Question does not belong to this session' }, { status: 400 });
      }

      const alreadyAnswered = session.interactions.some((i) => i.questionId === questionId);
      if (alreadyAnswered) {
        return NextResponse.json({ error: 'Question already answered in this session' }, { status: 400 });
      }

      const labels = ['A', 'B', 'C', 'D'];
      const correctIdx = question.options.findIndex((o) => o.isCorrect);
      correctLabel = correctIdx >= 0 ? labels[correctIdx] : 'A';
      kc = question.kc || '';
      irtParams = { a: question.irt_a, b: question.irt_b, c: question.irt_c };
      questionRecord = { id: questionId };
    }

    // -------------------------------------------------------------------
    // Evaluate correctness
    // -------------------------------------------------------------------
    const isCorrect = selectedAnswer.toUpperCase() === correctLabel;

    // -------------------------------------------------------------------
    // IRT Update (EAP)
    // -------------------------------------------------------------------
    // Build full response history from existing interactions
    const allResponses: Array<{ params: IRTParams; isCorrect: boolean }> = [
      ...session.interactions.map((i) => {
        const q = i.question;
        return {
          params: { a: q.irt_a, b: q.irt_b, c: q.irt_c } as IRTParams,
          isCorrect: i.isCorrect,
        };
      }),
      { params: irtParams, isCorrect },
    ];

    const eap = eapEstimate(allResponses);

    // -------------------------------------------------------------------
    // BKT Update
    // -------------------------------------------------------------------
    const kcStates: Record<string, KCState> = JSON.parse(session.kcStates || '{}');
    const currentKCState: KCState = kcStates[kc] || { ...DEFAULT_BKT_PARAMS };
    const bktParams = DEFAULT_BKT_PARAMS[kc] || DEFAULT_BKT_PARAMS['UK_capitals'];
    const updatedKCState = updateKCState(currentKCState, isCorrect, bktParams);
    kcStates[kc] = updatedKCState;
    const isMastered = updatedKCState.pLearned >= 0.95;

    // -------------------------------------------------------------------
    // KCMastery upsert (Successive Relearning)
    // -------------------------------------------------------------------
    if (kc) {
      try {
        const wasMastered = (await prisma.kCMastery.findUnique({
          where: { sessionId_kcId: { sessionId, kcId: kc } },
        }))?.masteredAt != null;

        const nowMastered = isMastered;

        await prisma.kCMastery.upsert({
          where: { sessionId_kcId: { sessionId, kcId: kc } },
          create: {
            sessionId,
            kcId: kc,
            pLearned: updatedKCState.pLearned,
            pForget: 0.1,
            masteredAt: nowMastered ? new Date() : null,
            lastAssessedAt: new Date(),
          },
          update: {
            pLearned: updatedKCState.pLearned,
            lastAssessedAt: new Date(),
            masteredAt: nowMastered && !wasMastered ? new Date() : undefined,
          },
        });
      } catch (err) {
        console.warn('KCMastery upsert failed:', err);
      }
    }

    // --- Update Confidence Calibration ---
    if (confidenceLevel && (confidenceLevel === 1 || confidenceLevel === 3)) {
      try {
        const calibrationUpdate: Record<string, { increment: number }> = {};
        if (confidenceLevel === 3) {
          calibrationUpdate[isCorrect ? 'highConfCorrect' : 'highConfWrong'] = { increment: 1 };
        } else {
          calibrationUpdate[isCorrect ? 'lowConfCorrect' : 'lowConfWrong'] = { increment: 1 };
        }
        await prisma.confidenceCalibration.upsert({
          where: { sessionId },
          create: {
            sessionId,
            highConfCorrect: confidenceLevel === 3 && isCorrect ? 1 : 0,
            highConfWrong: confidenceLevel === 3 && !isCorrect ? 1 : 0,
            lowConfCorrect: confidenceLevel === 1 && isCorrect ? 1 : 0,
            lowConfWrong: confidenceLevel === 1 && !isCorrect ? 1 : 0,
          },
          update: calibrationUpdate,
        });
      } catch (err) {
        console.warn('ConfidenceCalibration upsert failed:', err);
      }
    }

    // -------------------------------------------------------------------
    // Persist Interaction + Session Update in one transaction
    // For variant-based answers, store the variantId in questionId field
    // We create a synthetic interaction for analytics continuity
    // -------------------------------------------------------------------
    let interactionId: string;

    if (isVariant) {
      // For variants, store interaction using a fallback question ID
      // We find the first question in the quiz to use as a placeholder
      // (the real data lives in VariantPresentation)
      // OR we skip creating an Interaction and rely on VariantPresentation
      // Decision: create a minimal log entry for session analytics

      // Get any question from this session's quiz for foreign key compliance
      const anyQuestion = await prisma.question.findFirst({
        where: { quizId: session.quizId },
      });

      if (anyQuestion) {
        const [interaction] = await prisma.$transaction([
          prisma.interaction.create({
            data: {
              sessionId,
              questionId: anyQuestion.id,  // placeholder FK
              selectedAnswer: selectedAnswer.toString().toUpperCase(),
              isCorrect,
              responseTimeMs: responseTimeMs || 0,
              theta_before: session.theta,
              theta_after: eap.theta,
              pLearned_before: currentKCState.pLearned,
              pLearned_after: updatedKCState.pLearned,
              cognitiveLoad: cognitiveLoad ?? null,
            },
          }),
          prisma.session.update({
            where: { id: sessionId },
            data: {
              theta: eap.theta,
              thetaSd: eap.sd,
              kcStates: JSON.stringify(kcStates),
            },
          }),
        ]);
        interactionId = interaction.id;
      } else {
        // No questions at all — just update session
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            theta: eap.theta,
            thetaSd: eap.sd,
            kcStates: JSON.stringify(kcStates),
          },
        });
        interactionId = 'variant-only';
      }
    } else {
      // Legacy path: normal interaction creation
      const [interaction] = await prisma.$transaction([
        prisma.interaction.create({
          data: {
            sessionId,
            questionId: questionRecord!.id,
            selectedAnswer: selectedAnswer.toString().toUpperCase(),
            isCorrect,
            responseTimeMs: responseTimeMs || 0,
              theta_before: session.theta,
              theta_after: eap.theta,
              pLearned_before: currentKCState.pLearned,
              pLearned_after: updatedKCState.pLearned,
              cognitiveLoad: cognitiveLoad ?? null,
          },
        }),
        prisma.session.update({
          where: { id: sessionId },
          data: {
            theta: eap.theta,
            thetaSd: eap.sd,
            kcStates: JSON.stringify(kcStates),
          },
        }),
      ]);
      interactionId = interaction.id;
    }

    // -------------------------------------------------------------------
    // Response
    // -------------------------------------------------------------------
    return NextResponse.json({
      correct: isCorrect,
      correctAnswer: correctLabel,
      selectedAnswer: selectedAnswer.toString().toUpperCase(),
      theta: {
        before: session.theta,
        after: eap.theta,
        delta: Math.round((eap.theta - session.theta) * 1000) / 1000,
        sd: eap.sd,
        ci95: [
          Math.round((eap.theta - 1.96 * eap.sd) * 1000) / 1000,
          Math.round((eap.theta + 1.96 * eap.sd) * 1000) / 1000,
        ] as [number, number],
      },
      bkt: {
        kc,
        pLearned_before: currentKCState.pLearned,
        pLearned_after: updatedKCState.pLearned,
        isMastered,
      },
      interactionId,
    });

  } catch (error) {
    console.error('POST /api/sessions/[id]/answer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



