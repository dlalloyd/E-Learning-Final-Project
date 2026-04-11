/**
 * Learner Profile API - Psychometric-style learner insights
 *
 * Generates a personalised profile based on learning behaviour patterns,
 * similar to psychometric assessment tools but grounded in educational
 * measurement theory:
 *
 * - Learning pace classification (Bloom mastery rate)
 * - Knowledge strengths/weaknesses (BKT mastery per KC)
 * - Response pattern analysis (speed vs accuracy trade-off)
 * - Cognitive style indicators (hint usage, review requests)
 * - Confidence calibration (Dunning-Kruger awareness)
 * - Growth trajectory (theta over time)
 * - Engagement patterns (session frequency, duration)
 *
 * The more sessions completed, the more accurate the profile becomes.
 * References: Mislevy (1993) evidence-centred design; Corbett & Anderson (1995) BKT
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getAuthFromCookie } from '@/lib/auth/jwt';

interface ProfileTrait {
  label: string;
  value: number;       // 0-100 percentile or score
  description: string;
  confidence: 'low' | 'medium' | 'high'; // based on data quantity
  dataPoints: number;
}

interface LearnerArchetype {
  primary: string;
  secondary: string;
  description: string;
}

export async function GET() {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Parallel data fetch
    const [user, sessions, interactions, kcMasteries, elaborations] = await Promise.all([
      prisma.user.findUnique({
        where: { id: auth.userId },
        select: { name: true, totalXp: true, level: true, currentStreak: true, longestStreak: true, createdAt: true },
      }),
      prisma.session.findMany({
        where: { userId: auth.userId, completedAt: { not: null } },
        orderBy: { startedAt: 'asc' },
        select: { id: true, theta: true, startedAt: true, completedAt: true, condition: true },
      }),
      prisma.interaction.findMany({
        where: { session: { userId: auth.userId } },
        orderBy: { createdAt: 'asc' },
        select: {
          isCorrect: true,
          responseTimeMs: true,
          hintsUsed: true,
          hintLevelMax: true,
          cognitiveLoad: true,
          theta_before: true,
          theta_after: true,
          pLearned_before: true,
          pLearned_after: true,
          session: { select: { id: true } },
        },
      }),
      prisma.kCMastery.findMany({
        where: { session: { userId: auth.userId } },
        include: { kc: { select: { name: true, bloomLevel: true } } },
      }),
      prisma.elaborationResponse.findMany({
        where: { userId: auth.userId },
        select: { responseTimeMs: true, response: true },
      }),
    ]);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const totalInteractions = interactions.length;
    const totalSessions = sessions.length;
    const dataConfidence: 'low' | 'medium' | 'high' =
      totalInteractions < 15 ? 'low' : totalInteractions < 50 ? 'medium' : 'high';

    // --- Accuracy Analysis ---
    const correctCount = interactions.filter(i => i.isCorrect).length;
    const accuracy = totalInteractions > 0 ? correctCount / totalInteractions : 0;

    // --- Response Speed Analysis ---
    const responseTimes = interactions.map(i => i.responseTimeMs).filter(t => t > 0);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    const medianResponseTime = responseTimes.length > 0
      ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)]
      : 0;

    // Speed-accuracy trade-off
    const fastCorrect = interactions.filter(i => i.isCorrect && i.responseTimeMs < 10000).length;
    const fastIncorrect = interactions.filter(i => !i.isCorrect && i.responseTimeMs < 10000).length;
    const slowCorrect = interactions.filter(i => i.isCorrect && i.responseTimeMs >= 10000).length;
    const impulsivityScore = totalInteractions > 0
      ? (fastIncorrect / Math.max(fastIncorrect + slowCorrect, 1)) * 100
      : 50;

    // --- Hint Usage Pattern ---
    const hintInteractions = interactions.filter(i => i.hintsUsed > 0);
    const hintUsageRate = totalInteractions > 0 ? hintInteractions.length / totalInteractions : 0;
    const avgHintLevel = hintInteractions.length > 0
      ? hintInteractions.reduce((sum, i) => sum + i.hintLevelMax, 0) / hintInteractions.length
      : 0;

    // --- Learning Velocity ---
    // How quickly theta increases per question
    const thetaDeltas = interactions
      .filter(i => i.theta_after !== null && i.theta_before !== null)
      .map(i => i.theta_after - i.theta_before);
    const avgThetaDelta = thetaDeltas.length > 0
      ? thetaDeltas.reduce((a, b) => a + b, 0) / thetaDeltas.length
      : 0;

    // --- KC Strength Map ---
    const kcMap = new Map<string, { name: string; pLearned: number; bloom: number }>();
    for (const m of kcMasteries) {
      const existing = kcMap.get(m.kcId);
      if (!existing || m.pLearned > existing.pLearned) {
        kcMap.set(m.kcId, { name: m.kc.name, pLearned: m.pLearned, bloom: m.kc.bloomLevel });
      }
    }
    const strengths = [...kcMap.entries()]
      .sort((a, b) => b[1].pLearned - a[1].pLearned)
      .slice(0, 3)
      .map(([id, data]) => ({ kcId: id, ...data }));
    const weaknesses = [...kcMap.entries()]
      .sort((a, b) => a[1].pLearned - b[1].pLearned)
      .slice(0, 3)
      .map(([id, data]) => ({ kcId: id, ...data }));

    // --- Cognitive Load Perception ---
    const loadRatings = interactions.filter(i => i.cognitiveLoad !== null).map(i => i.cognitiveLoad!);
    const avgCognitiveLoad = loadRatings.length > 0
      ? loadRatings.reduce((a, b) => a + b, 0) / loadRatings.length
      : 0;

    // --- Theta Trajectory ---
    const thetaHistory = sessions.map(s => ({
      sessionIndex: sessions.indexOf(s) + 1,
      theta: s.theta,
      date: s.startedAt,
    }));

    // --- Elaboration Engagement ---
    const elaborationCount = elaborations.length;
    const avgElaborationLength = elaborations.length > 0
      ? elaborations.reduce((sum, e) => sum + e.response.length, 0) / elaborations.length
      : 0;

    // --- Session Patterns ---
    const sessionDurations = sessions
      .filter(s => s.completedAt)
      .map(s => (s.completedAt!.getTime() - s.startedAt.getTime()) / 60000); // minutes
    const avgSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
      : 0;

    // --- Determine Learning Archetype ---
    const archetype = determineArchetype({
      accuracy,
      avgResponseTime,
      hintUsageRate,
      avgThetaDelta,
      elaborationCount,
      avgCognitiveLoad,
      totalSessions,
    });

    // --- Build Profile Traits ---
    const traits: ProfileTrait[] = [
      {
        label: 'Accuracy',
        value: Math.round(accuracy * 100),
        description: accuracy >= 0.8 ? 'You consistently select correct answers, showing strong knowledge retention.'
          : accuracy >= 0.6 ? 'You have a solid foundation but some topics need reinforcement.'
          : 'You are still building your knowledge base. Keep practising - accuracy improves with repetition.',
        confidence: dataConfidence,
        dataPoints: totalInteractions,
      },
      {
        label: 'Response Speed',
        value: Math.round(Math.max(0, Math.min(100, 100 - (medianResponseTime / 300)))),
        description: medianResponseTime < 8000 ? 'You process questions quickly, suggesting strong recall.'
          : medianResponseTime < 15000 ? 'You take a measured approach, balancing speed with accuracy.'
          : 'You think carefully before answering. Consider whether this helps or if faster retrieval practice would be beneficial.',
        confidence: dataConfidence,
        dataPoints: responseTimes.length,
      },
      {
        label: 'Self-Regulation',
        value: Math.round(Math.min(100, (hintUsageRate * 100 + (elaborationCount > 0 ? 30 : 0)))),
        description: hintUsageRate > 0.3 ? 'You actively seek help when needed - a sign of metacognitive awareness.'
          : hintUsageRate > 0.1 ? 'You use hints selectively, showing good self-monitoring.'
          : 'You rarely use hints. Try using them strategically - they can deepen understanding without just giving answers.',
        confidence: dataConfidence,
        dataPoints: totalInteractions,
      },
      {
        label: 'Persistence',
        value: Math.round(Math.min(100, totalSessions * 15 + (user.longestStreak * 5))),
        description: totalSessions >= 5 ? 'Your consistent return shows excellent learning commitment.'
          : totalSessions >= 2 ? 'You are building a learning habit. Consistency is key to retention.'
          : 'Complete more sessions to build your learning momentum.',
        confidence: totalSessions >= 3 ? 'medium' : 'low',
        dataPoints: totalSessions,
      },
      {
        label: 'Growth Rate',
        value: Math.round(Math.max(0, Math.min(100, 50 + avgThetaDelta * 500))),
        description: avgThetaDelta > 0.02 ? 'Your ability estimate is improving rapidly. You learn efficiently from feedback.'
          : avgThetaDelta > 0 ? 'You are making steady progress. Each session pushes your understanding further.'
          : 'Your growth has plateaued. Try reviewing material for topics you find challenging.',
        confidence: dataConfidence,
        dataPoints: thetaDeltas.length,
      },
      {
        label: 'Depth of Processing',
        value: Math.round(Math.min(100, (avgElaborationLength / 3) + (elaborationCount * 10))),
        description: elaborationCount >= 3 ? 'You engage deeply with material, writing thoughtful reflections.'
          : elaborationCount > 0 ? 'You have started reflecting on your answers. More practice deepens understanding.'
          : 'Try answering the reflection prompts when they appear - they strengthen long-term memory.',
        confidence: elaborationCount >= 3 ? 'medium' : 'low',
        dataPoints: elaborationCount,
      },
    ];

    // --- Profile Accuracy Indicator ---
    const profileAccuracy = Math.min(100, Math.round(
      (totalInteractions / 100) * 30 +
      (totalSessions / 10) * 30 +
      (kcMap.size / 13) * 20 +
      (elaborationCount > 0 ? 10 : 0) +
      (loadRatings.length > 5 ? 10 : 0)
    ));

    return NextResponse.json({
      userName: user.name,
      memberSince: user.createdAt,
      profileAccuracy,
      profileAccuracyLabel: profileAccuracy < 30 ? 'Emerging - complete more sessions for deeper insights'
        : profileAccuracy < 60 ? 'Developing - your profile is taking shape'
        : profileAccuracy < 85 ? 'Established - reliable learning insights available'
        : 'Comprehensive - your learning profile is highly detailed',
      archetype,
      traits,
      stats: {
        totalSessions,
        totalQuestions: totalInteractions,
        totalCorrect: correctCount,
        accuracy: Math.round(accuracy * 100),
        avgResponseTimeMs: Math.round(avgResponseTime),
        avgSessionMinutes: Math.round(avgSessionDuration),
        currentTheta: sessions.length > 0 ? sessions[sessions.length - 1].theta : -0.78,
        totalXp: user.totalXp,
        level: user.level,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        kcsMastered: [...kcMap.values()].filter(k => k.pLearned >= 0.8).length,
        totalKCs: 13,
      },
      strengths,
      weaknesses,
      thetaHistory,
      impulsivityScore: Math.round(impulsivityScore),
      avgCognitiveLoad: Math.round(avgCognitiveLoad * 10) / 10,
    });
  } catch (error) {
    console.error('GET /api/learner-profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function determineArchetype(data: {
  accuracy: number;
  avgResponseTime: number;
  hintUsageRate: number;
  avgThetaDelta: number;
  elaborationCount: number;
  avgCognitiveLoad: number;
  totalSessions: number;
}): LearnerArchetype {
  // Determine primary archetype based on dominant behaviour pattern
  const archetypes = [
    {
      id: 'methodical',
      score: (data.avgResponseTime > 12000 ? 2 : 0) + (data.hintUsageRate > 0.2 ? 2 : 0) + (data.accuracy > 0.7 ? 1 : 0),
      label: 'The Methodical Learner',
      desc: 'You take your time, use available resources, and build understanding systematically. Your careful approach leads to strong retention.',
    },
    {
      id: 'intuitive',
      score: (data.avgResponseTime < 8000 ? 2 : 0) + (data.accuracy > 0.75 ? 2 : 0) + (data.hintUsageRate < 0.1 ? 1 : 0),
      label: 'The Intuitive Learner',
      desc: 'You process information quickly and trust your instincts. Your fast, accurate responses suggest strong pattern recognition.',
    },
    {
      id: 'explorer',
      score: (data.elaborationCount > 2 ? 2 : 0) + (data.hintUsageRate > 0.15 ? 1 : 0) + (data.totalSessions > 3 ? 2 : 0),
      label: 'The Explorer',
      desc: 'You are curious and engaged, exploring topics through elaboration and repeated practice. You learn by making connections.',
    },
    {
      id: 'sprinter',
      score: (data.avgResponseTime < 6000 ? 2 : 0) + (data.avgThetaDelta > 0.01 ? 2 : 0) + (data.hintUsageRate < 0.05 ? 1 : 0),
      label: 'The Sprinter',
      desc: 'You learn in quick bursts, making rapid progress. Your growth rate is high but consider slowing down for complex topics.',
    },
    {
      id: 'strategist',
      score: (data.hintUsageRate > 0.1 && data.hintUsageRate < 0.3 ? 2 : 0) + (data.accuracy > 0.65 ? 1 : 0) + (data.avgCognitiveLoad > 0 && data.avgCognitiveLoad < 3.5 ? 2 : 0),
      label: 'The Strategist',
      desc: 'You balance challenge and support wisely, using hints when needed and pushing yourself when ready. An efficient learner.',
    },
  ];

  archetypes.sort((a, b) => b.score - a.score);
  const primary = archetypes[0];
  const secondary = archetypes[1];

  return {
    primary: primary.label,
    secondary: secondary.label,
    description: primary.desc,
  };
}
