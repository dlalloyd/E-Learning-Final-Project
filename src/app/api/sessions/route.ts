/**
 * POST /api/sessions
 * Creates a new learning session for a user
 * Initialises IRT learner state (θ₀ = -0.780) and BKT KC states
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { THETA_INITIAL, THETA_INITIAL_SD, estimateThetaFromAssessment } from '@/lib/algorithms/irt';
import { initialiseAllKCs } from '@/lib/algorithms/bkt';
import type { KCState } from '@/lib/algorithms/bkt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, quizId, condition = 'adaptive', seedFromAssessmentId } = body;

    // Validate required fields
    if (!userId || !quizId) {
      return NextResponse.json(
        { error: 'userId and quizId are required' },
        { status: 400 }
      );
    }

    // Validate condition
    if (condition !== 'adaptive' && condition !== 'static') {
      return NextResponse.json(
        { error: 'condition must be "adaptive" or "static"' },
        { status: 400 }
      );
    }

    // Verify user exists (authenticated users pass their cuid; legacy fallback for study IDs)
    let resolvedUserId = userId;
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      // Legacy: create study participant with @study.local email
      const user = await prisma.user.upsert({
        where: { email: `${userId}@study.local` },
        update: {},
        create: {
          email: `${userId}@study.local`,
          name: userId,
          password: 'study-participant',
          role: 'learner',
        },
      });
      resolvedUserId = user.id;
    }

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Initialise BKT KC states for all 13 knowledge components
    const initialKCStates = initialiseAllKCs();

    // Seed from pre-test if assessment ID provided
    let startingTheta = THETA_INITIAL;
    let startingThetaSd = THETA_INITIAL_SD;
    let assessmentLink: string | null = null;

    if (seedFromAssessmentId) {
      const assessment = await prisma.assessment.findUnique({
        where: { id: seedFromAssessmentId },
        include: {
          answers: {
            include: {
              question: { select: { kc: true } },
            },
          },
        },
      });

      if (assessment && assessment.completedAt) {
        const totalQ = assessment.answers.length;
        const correctCount = assessment.answers.filter((a) => a.isCorrect).length;

        if (totalQ > 0) {
          // Compute seeded theta from pre-test score
          startingTheta = estimateThetaFromAssessment(correctCount, totalQ);
          // Tighter prior SD because we have evidence from the pre-test
          startingThetaSd = 0.35;
          assessmentLink = assessment.id;

          // Per-KC BKT nudge: +0.15 for each KC the learner answered correctly,
          // capped at 0.85 so the session still has room to track mastery growth.
          const correctKCs = new Set<string>();
          for (const ans of assessment.answers) {
            if (ans.isCorrect && ans.question.kc) {
              correctKCs.add(ans.question.kc);
            }
          }
          for (const kcId of correctKCs) {
            if (initialKCStates[kcId]) {
              const current = initialKCStates[kcId] as KCState;
              initialKCStates[kcId] = {
                ...current,
                pLearned: Math.min(0.85, current.pLearned + 0.15),
              };
            }
          }
        }
      }
    }

    // Create session with IRT priors (seeded from pre-test when available)
    const session = await prisma.session.create({
      data: {
        userId: resolvedUserId,
        quizId,
        condition,
        theta: startingTheta,
        thetaSd: startingThetaSd,
        kcStates: JSON.stringify(initialKCStates),
        startedFromAssessmentId: assessmentLink,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      condition: session.condition,
      theta: session.theta,
      thetaSd: session.thetaSd,
      seededFromAssessment: !!assessmentLink,
      message: 'Session created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}