/**
 * GET /api/sessions/[id]/summary
 * Returns session analytics for self-referenced feedback and progress dashboard
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
        confidenceCalibration: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const totalQuestions = session.interactions.length;
    const correctCount = session.interactions.filter((i) => i.isCorrect).length;
    const accuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;

    const responseTimes = session.interactions
      .map((i) => i.responseTimeMs)
      .filter((t): t is number => t !== null && t > 0);
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    // Get unique KC IDs from questions
    const kcIds = [...new Set(session.interactions.map((i) => i.question.kc).filter(Boolean))];
    
    // Fetch KC names
    const kcs = await prisma.knowledgeComponent.findMany({
      where: { id: { in: kcIds } },
    });
    const kcNameMap = new Map(kcs.map((k) => [k.id, k.name]));

    // Build KC performance map
    const kcMap = new Map<string, { kcId: string; kcName: string; attempted: number; correct: number }>();
    for (const interaction of session.interactions) {
      const kcId = interaction.question.kc;
      if (!kcId) continue;
      const existing = kcMap.get(kcId) || { kcId, kcName: kcNameMap.get(kcId) || kcId, attempted: 0, correct: 0 };
      existing.attempted += 1;
      if (interaction.isCorrect) existing.correct += 1;
      kcMap.set(kcId, existing);
    }

    // Fetch mastery levels
    const masteryRecords = await prisma.kCMastery.findMany({
      where: { sessionId, kcId: { in: kcIds } },
    });
    const masteryMap = new Map<string, number>(masteryRecords.map((m) => [m.kcId, m.pLearned]));

    const kcPerformance = Array.from(kcMap.values()).map((kc) => ({
      ...kc,
      accuracy: kc.attempted > 0 ? kc.correct / kc.attempted : 0,
      currentMastery: masteryMap.get(kc.kcId) || 0,
    }));

    const calibration = session.confidenceCalibration;
    const confidenceCalibration = calibration ? {
      highConfCorrect: calibration.highConfCorrect,
      highConfWrong: calibration.highConfWrong,
      lowConfCorrect: calibration.lowConfCorrect,
      lowConfWrong: calibration.lowConfWrong,
      calibrationScore: calculateCalibrationScore(calibration),
    } : null;

    const areasForReview = kcPerformance
      .filter((kc) => kc.currentMastery < 0.8)
      .sort((a, b) => a.currentMastery - b.currentMastery);

    return NextResponse.json({
      sessionId,
      status: session.completedAt ? 'completed' : 'in_progress',
      totalQuestions,
      correctCount,
      accuracy: Math.round(accuracy * 100) / 100,
      avgResponseTimeMs: Math.round(avgResponseTime),
      currentTheta: session.theta,
      kcPerformance,
      confidenceCalibration,
      areasForReview,
      feedbackMessage: generateFeedbackMessage(accuracy, kcPerformance),
    });
  } catch (error) {
    console.error('GET /api/sessions/[id]/summary error:', error);
    return NextResponse.json({ error: 'Failed to fetch session summary' }, { status: 500 });
  }
}

function calculateCalibrationScore(c: { highConfCorrect: number; highConfWrong: number; lowConfCorrect: number; lowConfWrong: number }): number {
  const highTotal = c.highConfCorrect + c.highConfWrong;
  const lowTotal = c.lowConfCorrect + c.lowConfWrong;
  if (highTotal === 0 && lowTotal === 0) return 0.5;
  const highAcc = highTotal > 0 ? c.highConfCorrect / highTotal : 0.5;
  const lowCal = lowTotal > 0 ? c.lowConfWrong / lowTotal : 0.5;
  const total = highTotal + lowTotal;
  return Math.round(((highAcc * highTotal + lowCal * lowTotal) / total) * 100) / 100;
}

function generateFeedbackMessage(accuracy: number, kcPerformance: Array<{ kcName: string; currentMastery: number }>): string {
  const struggling = kcPerformance.filter((kc) => kc.currentMastery < 0.5);
  if (accuracy >= 0.9) return 'Excellent work! You demonstrated strong understanding.';
  if (accuracy >= 0.7) return struggling.length > 0 ? `Good progress! Review: ${struggling.map((k) => k.kcName).join(', ')}.` : 'Good progress!';
  if (accuracy >= 0.5) return `Building foundations. Focus on: ${struggling.slice(0, 2).map((k) => k.kcName).join(', ')}.`;
  return 'This is challenging. Consider reviewing prerequisite materials.';
}




