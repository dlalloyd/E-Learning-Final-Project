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

    // Verify user exists (must be an authenticated user)
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found. Please log in first.' },
        { status: 401 }
      );
    }
    const resolvedUserId = userId;

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Initialise BKT KC states for all 13 knowledge components
    const initialKCStates = initialiseAllKCs();

    // Carry over theta and BKT states from the user's last completed session.
    // Without this, every session resets to the cold-start prior regardless of
    // prior learning — breaking the cross-session adaptive claim.
    const lastSession = await prisma.session.findFirst({
      where: { userId: resolvedUserId, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      include: {
        kcMasteries: { select: { kcId: true, pLearned: true, lastAssessedAt: true } },
      },
    });

    let startingTheta = lastSession ? lastSession.theta : THETA_INITIAL;
    let startingThetaSd = lastSession ? Math.min(lastSession.thetaSd + 0.05, 0.543) : THETA_INITIAL_SD;
    let assessmentLink: string | null = null;

    if (lastSession && lastSession.kcMasteries.length > 0) {
      // Apply decay to carried-over BKT states (Pavlik & Anderson, 2005).
      // pLearned decays ~10% per day, floor 0.20, so the system still
      // challenges returning learners on lapsed KCs.
      const DECAY_RATE = 0.1;
      const DECAY_FLOOR = 0.2;
      const now = new Date();

      for (const m of lastSession.kcMasteries) {
        if (initialKCStates[m.kcId]) {
          const daysSince =
            (now.getTime() - m.lastAssessedAt.getTime()) / (1000 * 60 * 60 * 24);
          const decayed = Math.max(
            DECAY_FLOOR,
            m.pLearned * Math.exp(-DECAY_RATE * daysSince)
          );
          initialKCStates[m.kcId] = {
            ...initialKCStates[m.kcId],
            pLearned: Math.round(decayed * 1000) / 1000,
            isMastered: decayed >= 0.95,
          };
        }
      }
    }

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