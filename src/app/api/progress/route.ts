/**
 * Cross-Session Progress API (Feature 2)
 *
 * Returns longitudinal data for a user across all sessions:
 * - Theta trajectory over time
 * - KC mastery progression
 * - Session history with scores
 * - Knowledge decay status (Feature 7 - Pavlik & Anderson, 2008)
 *
 * Also handles condition escalation recommendation (Feature 3).
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getAuthFromCookie } from '@/lib/auth/jwt';

// Decay model constants (ACT-R inspired, Pavlik & Anderson 2008)
const DECAY_RATE = 0.1; // pLearned decays by ~10% per day without practice
const DECAY_FLOOR = 0.2; // pLearned never drops below this

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // All completed sessions
    const sessions = await prisma.session.findMany({
      where: { userId: auth.userId, completedAt: { not: null } },
      orderBy: { completedAt: 'asc' },
      include: {
        interactions: { select: { isCorrect: true, responseTimeMs: true } },
        kcMasteries: true,
      },
    });

    // Session timeline
    const sessionTimeline = sessions.map((s) => {
      const correct = s.interactions.filter((i) => i.isCorrect).length;
      const total = s.interactions.length;
      const avgTime = total > 0
        ? s.interactions.reduce((sum, i) => sum + i.responseTimeMs, 0) / total
        : 0;
      return {
        sessionId: s.id,
        date: s.completedAt,
        theta: s.theta,
        accuracy: total > 0 ? correct / total : 0,
        totalQuestions: total,
        correct,
        avgResponseTimeMs: Math.round(avgTime),
        condition: s.condition,
      };
    });

    // KC mastery progression (latest mastery per KC)
    const latestMasteries = new Map<string, { pLearned: number; lastAssessedAt: Date; kcId: string }>();
    for (const session of sessions) {
      for (const m of session.kcMasteries) {
        const existing = latestMasteries.get(m.kcId);
        if (!existing || m.lastAssessedAt > existing.lastAssessedAt) {
          latestMasteries.set(m.kcId, {
            pLearned: m.pLearned,
            lastAssessedAt: m.lastAssessedAt,
            kcId: m.kcId,
          });
        }
      }
    }

    // Apply knowledge decay model (Feature 7)
    const now = new Date();
    const kcNames = await prisma.knowledgeComponent.findMany();
    const kcNameMap = new Map(kcNames.map((k) => [k.id, k.name]));

    const kcProgress = Array.from(latestMasteries.values()).map((m) => {
      const daysSince = (now.getTime() - m.lastAssessedAt.getTime()) / (1000 * 60 * 60 * 24);
      const decayedPLearned = Math.max(
        DECAY_FLOOR,
        m.pLearned * Math.exp(-DECAY_RATE * daysSince)
      );
      const needsReview = decayedPLearned < m.pLearned * 0.8; // dropped 20%+
      return {
        kcId: m.kcId,
        kcName: kcNameMap.get(m.kcId) || m.kcId,
        storedPLearned: m.pLearned,
        decayedPLearned: Math.round(decayedPLearned * 100) / 100,
        daysSinceLastPractice: Math.round(daysSince * 10) / 10,
        needsReview,
        lastPracticed: m.lastAssessedAt,
      };
    });

    // Condition escalation recommendation (Feature 3)
    const latestSession = sessions[sessions.length - 1];
    const recentTheta = latestSession?.theta ?? -1;
    const recentAccuracy = sessionTimeline[sessionTimeline.length - 1]?.accuracy ?? 0;
    const sessionCount = sessions.length;

    let conditionRecommendation: string | null = null;
    if (latestSession?.condition === 'static' && recentAccuracy >= 0.7 && sessionCount >= 2) {
      conditionRecommendation = 'adaptive';
    }

    // Overall stats
    const totalMastered = kcProgress.filter((k) => k.decayedPLearned >= 0.95).length;
    const totalDecayed = kcProgress.filter((k) => k.needsReview).length;
    const totalKCs = kcNames.length;

    return NextResponse.json({
      sessionTimeline,
      kcProgress,
      stats: {
        totalSessions: sessions.length,
        currentTheta: recentTheta,
        totalMastered,
        totalDecayed,
        totalKCs,
        overallProgress: Math.round((totalMastered / Math.max(totalKCs, 1)) * 100),
      },
      conditionRecommendation,
    });
  } catch (error) {
    console.error('GET /api/progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
