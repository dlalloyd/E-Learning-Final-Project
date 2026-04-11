/**
 * GET /api/sessions/[id]/summary
 * Returns enriched session analytics for the post-quiz report.
 *
 * Extended in Phase 10 with:
 *   - Distractor analysis (top 3 attractive wrong answers)
 *   - Hint usage per KC
 *   - Longitudinal delta vs prior sessions
 *   - Narrative journey sentence
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    // Load session with interactions (including hint fields), calibration, and VariantPresentations
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        interactions: {
          include: { question: true },
          orderBy: { createdAt: 'asc' },
        },
        confidenceCalibration: true,
        variantPresentations: {
          orderBy: { presentedAt: 'asc' },
        },
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

    // KC name lookup
    const kcIds = [...new Set(session.interactions.map((i) => i.question.kc).filter(Boolean))];
    const kcs = await prisma.knowledgeComponent.findMany({
      where: { id: { in: kcIds } },
    });
    const kcNameMap = new Map(kcs.map((k) => [k.id, k.name]));

    // Build KC performance map with hint usage
    const kcMap = new Map<string, {
      kcId: string; kcName: string;
      attempted: number; correct: number;
      hintsUsed: number; hintLevelMax: number;
    }>();
    for (const interaction of session.interactions) {
      const kcId = interaction.question.kc;
      if (!kcId) continue;
      const existing = kcMap.get(kcId) || {
        kcId,
        kcName: kcNameMap.get(kcId) || kcId,
        attempted: 0, correct: 0,
        hintsUsed: 0, hintLevelMax: 0,
      };
      existing.attempted += 1;
      if (interaction.isCorrect) existing.correct += 1;
      existing.hintsUsed += (interaction as any).hintsUsed ?? 0;
      existing.hintLevelMax = Math.max(existing.hintLevelMax, (interaction as any).hintLevelMax ?? 0);
      kcMap.set(kcId, existing);
    }

    // Mastery records
    const masteryRecords = await prisma.kCMastery.findMany({
      where: { sessionId, kcId: { in: kcIds } },
    });
    const masteryMap = new Map<string, number>(masteryRecords.map((m) => [m.kcId, m.pLearned]));

    const kcPerformance = Array.from(kcMap.values()).map((kc) => ({
      ...kc,
      accuracy: kc.attempted > 0 ? kc.correct / kc.attempted : 0,
      currentMastery: masteryMap.get(kc.kcId) || 0,
    }));

    // -----------------------------------------------------------------------
    // Distractor analysis (variant path)
    // -----------------------------------------------------------------------
    const distractorCounts = new Map<string, { key: string; kcId: string; kcName: string; chosen: number; correct: string }>();

    for (const vp of session.variantPresentations) {
      if (vp.isCorrect !== false) continue; // only wrong answers
      const variant = await prisma.questionVariant.findUnique({
        where: { id: vp.variantId },
        include: { template: { select: { kcId: true } } },
      });
      if (!variant) continue;
      // The chosen answer label is stored in the Interaction.selectedAnswer for legacy
      // For variant path we use the VariantPresentation which doesn't store the label.
      // We surface the distractor count per KC instead.
      const kcId = variant.template.kcId;
      const key = `${kcId}:${variant.id}`;
      const existing = distractorCounts.get(key) || {
        key,
        kcId,
        kcName: kcNameMap.get(kcId) || kcId,
        chosen: 0,
        correct: variant.correctAnswer,
      };
      existing.chosen += 1;
      distractorCounts.set(key, existing);
    }

    const topDistractors = [...distractorCounts.values()]
      .sort((a, b) => b.chosen - a.chosen)
      .slice(0, 3)
      .map((d) => ({
        kcName: d.kcName,
        timesChosenWrong: d.chosen,
        correctAnswer: d.correct,
      }));

    // -----------------------------------------------------------------------
    // Longitudinal delta vs prior 3 sessions
    // -----------------------------------------------------------------------
    const priorSessions = await prisma.session.findMany({
      where: {
        userId: session.userId,
        completedAt: { not: null },
        id: { not: sessionId },
      },
      orderBy: { completedAt: 'desc' },
      take: 3,
      select: { theta: true, completedAt: true },
    });

    const longitudinal = priorSessions.length > 0 ? {
      priorSessionCount: priorSessions.length,
      avgPriorTheta: priorSessions.reduce((s, p) => s + p.theta, 0) / priorSessions.length,
      deltaTheta: session.theta - (priorSessions.reduce((s, p) => s + p.theta, 0) / priorSessions.length),
    } : null;

    // -----------------------------------------------------------------------
    // Confidence calibration
    // -----------------------------------------------------------------------
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

    // -----------------------------------------------------------------------
    // Narrative journey sentence
    // -----------------------------------------------------------------------
    const masteredKCs = kcPerformance.filter((k) => k.currentMastery >= 0.95);
    const narrative = buildNarrative(session.theta, accuracy, masteredKCs.length, longitudinal, kcPerformance);

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
      // Phase 10 additions
      topDistractors,
      longitudinal,
      narrative,
    });
  } catch (error) {
    console.error('GET /api/sessions/[id]/summary error:', error);
    return NextResponse.json({ error: 'Failed to fetch session summary' }, { status: 500 });
  }
}

function calculateCalibrationScore(c: {
  highConfCorrect: number; highConfWrong: number;
  lowConfCorrect: number; lowConfWrong: number;
}): number {
  const highTotal = c.highConfCorrect + c.highConfWrong;
  const lowTotal = c.lowConfCorrect + c.lowConfWrong;
  if (highTotal === 0 && lowTotal === 0) return 0.5;
  const highAcc = highTotal > 0 ? c.highConfCorrect / highTotal : 0.5;
  const lowCal = lowTotal > 0 ? c.lowConfWrong / lowTotal : 0.5;
  const total = highTotal + lowTotal;
  return Math.round(((highAcc * highTotal + lowCal * lowTotal) / total) * 100) / 100;
}

/**
 * Generate feedback following Hattie & Timperley (2007) three-level model:
 *   Level 1 (Task): What you got right/wrong
 *   Level 2 (Process): How to approach the material
 *   Level 3 (Self-regulation): How to monitor your own learning
 * Combined with Shute (2008) guidelines: be specific, be timely, focus on the
 * task not the person, and provide elaboration.
 */
function generateFeedbackMessage(
  accuracy: number,
  kcPerformance: Array<{ kcName: string; currentMastery: number; accuracy: number }>
): string {
  const struggling = kcPerformance.filter((kc) => kc.currentMastery < 0.5);
  const strong = kcPerformance.filter((kc) => kc.currentMastery >= 0.8);

  if (accuracy >= 0.9) {
    return strong.length > 0
      ? `Excellent work. You showed strong command of ${strong.slice(0, 2).map((k) => k.kcName).join(' and ')}. Ready for harder questions next time.`
      : 'Excellent work. You demonstrated strong understanding across all topics.';
  }
  if (accuracy >= 0.7) {
    return struggling.length > 0
      ? `Good progress overall. Your weakest area was ${struggling[0].kcName} (${Math.round(struggling[0].accuracy * 100)}% accuracy). Review that topic using "Learn First" mode.`
      : 'Good progress across all topics. Keep practising to push toward mastery.';
  }
  if (accuracy >= 0.5) {
    const focusAreas = struggling.slice(0, 2).map((k) => k.kcName).join(' and ');
    return `Building foundations. Focus your next session on ${focusAreas}. Use the hint system when uncertain rather than guessing.`;
  }
  return `This content is challenging. Start your next session with "Learn First" to study the material before attempting questions. Focus on one topic at a time.`;
}

function buildNarrative(
  theta: number,
  accuracy: number,
  masteredCount: number,
  longitudinal: { deltaTheta: number; priorSessionCount: number } | null,
  kcPerformance: Array<{ kcName: string; currentMastery: number; accuracy: number }>
): string {
  const abilityLabel = theta >= 1.5 ? 'Expert' : theta >= 0.5 ? 'Competent' : theta >= -0.5 ? 'Developing' : 'Beginner';
  const accuracyPct = Math.round(accuracy * 100);
  const strongest = kcPerformance.sort((a, b) => b.currentMastery - a.currentMastery)[0];
  const weakest = kcPerformance.sort((a, b) => a.currentMastery - b.currentMastery)[0];

  let sentence = `You finished at ${abilityLabel} level with ${accuracyPct}% accuracy`;
  if (masteredCount > 0) {
    sentence += `, mastering ${masteredCount} knowledge component${masteredCount !== 1 ? 's' : ''}`;
  }
  sentence += '.';

  // Add strongest/weakest KC context for specificity (Shute 2008)
  if (strongest && weakest && strongest.kcName !== weakest.kcName) {
    sentence += ` Your strongest topic was ${strongest.kcName}`;
    if (weakest.currentMastery < 0.5) {
      sentence += `, while ${weakest.kcName} needs the most attention`;
    }
    sentence += '.';
  }

  if (longitudinal && longitudinal.priorSessionCount > 0) {
    const delta = longitudinal.deltaTheta;
    if (delta >= 0.1) {
      sentence += ` Your ability improved by ${delta.toFixed(2)} logits compared to recent sessions.`;
    } else if (delta <= -0.1) {
      sentence += ` Your ability dipped by ${Math.abs(delta).toFixed(2)} logits compared to recent sessions - consider reviewing before your next attempt.`;
    }
  }
  return sentence;
}
