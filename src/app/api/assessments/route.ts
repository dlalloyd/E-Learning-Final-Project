/**
 * POST /api/assessments
 * Creates a pre-test, post-test, or delayed post-test assessment.
 *
 * Pre-test:  Administered before the learning session begins
 * Post-test: Administered immediately after the session completes
 * Delayed:   Administered 7+ days after original session (retention test)
 *
 * GET /api/assessments?userId=xxx
 * Lists all assessments for a user with status info.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

const ASSESSMENT_QUESTION_COUNT = 13; // One per KC for balanced coverage

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionId, type = 'pre_test' } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const validTypes = ['pre_test', 'post_test', 'delayed_post_test'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // For post-test and delayed, sessionId is required
    if ((type === 'post_test' || type === 'delayed_post_test') && !sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required for post-test and delayed post-test' },
        { status: 400 }
      );
    }

    // For delayed post-test, check 7-day minimum gap
    if (type === 'delayed_post_test' && sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { completedAt: true },
      });
      if (session?.completedAt) {
        const daysSinceCompletion = (Date.now() - session.completedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCompletion < 7) {
          return NextResponse.json({
            error: 'Delayed post-test requires at least 7 days after session completion',
            daysRemaining: Math.ceil(7 - daysSinceCompletion),
            availableAt: new Date(session.completedAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          }, { status: 400 });
        }
      }
    }

    // Check for existing incomplete assessment of same type for this session
    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        userId,
        type,
        completedAt: null,
        ...(sessionId ? { sessionId } : {}),
      },
    });

    if (existingAssessment) {
      // Return existing incomplete assessment
      const answeredCount = await prisma.answer.count({
        where: { assessmentId: existingAssessment.id },
      });
      return NextResponse.json({
        assessmentId: existingAssessment.id,
        type: existingAssessment.type,
        resumed: true,
        questionsAnswered: answeredCount,
        totalQuestions: ASSESSMENT_QUESTION_COUNT,
      });
    }

    // Capture theta at time of assessment (for pre-test this is baseline)
    let thetaAtTime: number | null = null;
    if (sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { theta: true },
      });
      thetaAtTime = session?.theta ?? null;
    }

    const assessment = await prisma.assessment.create({
      data: {
        userId,
        sessionId: sessionId || null,
        quizId: 'quiz-uk-geo-adaptive',
        type,
        thetaAtTime,
        maxScore: ASSESSMENT_QUESTION_COUNT,
      },
    });

    return NextResponse.json({
      assessmentId: assessment.id,
      type: assessment.type,
      totalQuestions: ASSESSMENT_QUESTION_COUNT,
      resumed: false,
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/assessments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter required' }, { status: 400 });
    }

    const assessments = await prisma.assessment.findMany({
      where: { userId },
      include: {
        _count: { select: { answers: true } },
        session: { select: { id: true, completedAt: true, theta: true } },
      },
      orderBy: { startedAt: 'desc' },
    });

    // Check if delayed post-test is available for any completed session
    const completedSessions = await prisma.session.findMany({
      where: { userId, completedAt: { not: null } },
      select: { id: true, completedAt: true },
    });

    const delayedTestAvailability = completedSessions.map((s: { id: string; completedAt: Date | null }) => {
      const daysSince = s.completedAt
        ? (Date.now() - s.completedAt.getTime()) / (1000 * 60 * 60 * 24)
        : 0;
      const hasDelayedTest = assessments.some(
        (a: { sessionId: string | null; type: string }) => a.sessionId === s.id && a.type === 'delayed_post_test'
      );
      return {
        sessionId: s.id,
        completedAt: s.completedAt,
        daysSinceCompletion: Math.floor(daysSince),
        delayedTestAvailable: daysSince >= 7,
        delayedTestCompleted: hasDelayedTest,
      };
    });

    return NextResponse.json({
      assessments: assessments.map((a: typeof assessments[number]) => ({
        id: a.id,
        type: a.type,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        score: a.score,
        maxScore: a.maxScore,
        passed: a.passed,
        thetaAtTime: a.thetaAtTime,
        answersCount: a._count.answers,
        sessionId: a.sessionId,
      })),
      delayedTestAvailability,
    });

  } catch (error) {
    console.error('GET /api/assessments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
