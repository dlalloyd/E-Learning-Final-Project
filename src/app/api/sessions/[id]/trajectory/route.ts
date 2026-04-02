/**
 * GET /api/sessions/[id]/trajectory
 * Returns theta progression and intervention data for learning trajectory visualization
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        interactions: {
          include: {
            question: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Build trajectory from interactions
    const trajectory = session.interactions.map((interaction, index) => ({
      questionIndex: index + 1,
      questionId: interaction.questionId,
      kcId: interaction.question.kc,
      isCorrect: interaction.isCorrect,
      thetaBefore: interaction.theta_before,
      thetaAfter: interaction.theta_after,
      pLearnedBefore: interaction.pLearned_before,
      pLearnedAfter: interaction.pLearned_after,
      responseTimeMs: interaction.responseTimeMs,
      timestamp: interaction.createdAt.toISOString(),
    }));

    // Fetch instruction_completed analytics events for intervention markers
    const instructionEvents = await prisma.analyticsEvent.findMany({
      where: {
        sessionId,
        eventType: 'instruction_completed',
      },
      orderBy: { timestamp: 'asc' },
    });

    // Map instruction events to intervention markers
    // Each event payload should contain kcId; we determine afterQuestionIndex
    // by finding the last interaction that occurred before the event timestamp
    const interventions = instructionEvents.map((event) => {
      const payload = event.payload as Record<string, unknown>;
      const eventTime = event.timestamp;

      // Find how many interactions occurred before this event
      let afterQuestionIndex = 0;
      for (let i = 0; i < session.interactions.length; i++) {
        if (session.interactions[i].createdAt <= eventTime) {
          afterQuestionIndex = i + 1;
        } else {
          break;
        }
      }

      return {
        afterQuestionIndex,
        type: 'instruction',
        kcId: (payload?.kcId as string) || '',
      };
    });

    return NextResponse.json({
      sessionId,
      trajectory,
      interventions,
    });
  } catch (error) {
    console.error('GET /api/sessions/[id]/trajectory error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trajectory data' },
      { status: 500 }
    );
  }
}
