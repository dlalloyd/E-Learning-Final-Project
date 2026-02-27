/**
 * POST /api/sessions
 * Creates a new learning session for a user
 * Initialises IRT learner state (θ₀ = -0.780) and BKT KC states
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { THETA_INITIAL, THETA_INITIAL_SD } from '@/lib/algorithms/irt';
import { initialiseAllKCs } from '@/lib/algorithms/bkt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, quizId, condition = 'adaptive' } = body;

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

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Initialise BKT KC states for all 13 knowledge components
    const initialKCStates = initialiseAllKCs();

    // Create session with IRT priors from self-pilot (θ₀ = -0.780)
    const session = await prisma.session.create({
      data: {
        userId,
        quizId,
        condition,
        theta: THETA_INITIAL,       // -0.780 logits (self-pilot EAP, 26/02/2026)
        thetaSd: THETA_INITIAL_SD,  // 0.543
        kcStates: JSON.stringify(initialKCStates),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      condition: session.condition,
      theta: session.theta,
      thetaSd: session.thetaSd,
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