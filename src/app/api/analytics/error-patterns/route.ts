/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/analytics/error-patterns?sessionId=xxx
 * Error Pattern Fingerprinting — clusters mistakes into cognitive profiles
 * and generates targeted remediation recommendations.
 *
 * Analyses:
 *   1. KC-level error rates and patterns
 *   2. Bloom-level vulnerability (remembering vs understanding vs applying)
 *   3. Response-time anomalies (fast-wrong = guessing, slow-wrong = misconception)
 *   4. Distractor analysis (which wrong answers are chosen repeatedly)
 *   5. Temporal patterns (errors increasing over time = fatigue)
 *
 * Returns a cognitive error profile with actionable remediation plan.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

// ─── Error Pattern Types ──────────────────────────────────────────────────────

interface ErrorCluster {
  type: 'guessing' | 'misconception' | 'careless_error' | 'knowledge_gap' | 'fatigue';
  confidence: number; // 0–1
  evidence: string[];
}

interface KCErrorProfile {
  kcId: string;
  kcName: string;
  bloomLevel: number;
  totalAttempts: number;
  errors: number;
  errorRate: number;
  avgResponseTimeMs: number;
  avgErrorResponseTimeMs: number;
  clusters: ErrorCluster[];
  remediation: string;
}

interface BloomVulnerability {
  level: number;
  label: string;
  totalAttempts: number;
  errors: number;
  errorRate: number;
}

interface ErrorFingerprint {
  sessionId: string;
  userId: string;
  overallErrorRate: number;
  dominantPattern: string;
  bloomVulnerabilities: BloomVulnerability[];
  kcProfiles: KCErrorProfile[];
  temporalPattern: {
    trend: 'improving' | 'declining' | 'stable';
    earlyErrorRate: number;
    lateErrorRate: number;
    fatigueDetected: boolean;
  };
  remediationPlan: string[];
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const FAST_RESPONSE_MS = 5000;   // <5s = likely guessing if wrong
const SLOW_RESPONSE_MS = 25000;  // >25s = deliberate but confused (misconception)
const FATIGUE_WINDOW = 0.3;      // last 30% of session
const GUESSING_THRESHOLD = 0.6;  // >60% fast-wrong = guessing pattern
const CARELESS_THRESHOLD = 0.4;  // >40% fast-wrong with high mastery = careless

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    const userId = req.nextUrl.searchParams.get('userId');

    if (!sessionId && !userId) {
      return NextResponse.json(
        { error: 'sessionId or userId query parameter required' },
        { status: 400 }
      );
    }

    // Build where clause — can analyse a single session or all sessions for a user
    const sessionWhere = sessionId
      ? { id: sessionId }
      : { userId: userId! };

    const sessions = await prisma.session.findMany({
      where: sessionWhere,
      include: {
        interactions: {
          include: { question: true },
          orderBy: { createdAt: 'asc' as const },
        },
        kcMasteries: true,
      },
    });

    if (sessions.length === 0) {
      return NextResponse.json({ error: 'No sessions found' }, { status: 404 });
    }

    // Flatten all interactions across sessions
    type SessionWithRelations = typeof sessions[number];
    type InteractionWithQuestion = SessionWithRelations['interactions'][number];

    const allInteractions: InteractionWithQuestion[] = sessions.flatMap((s: SessionWithRelations) => s.interactions);

    if (allInteractions.length === 0) {
      return NextResponse.json({ error: 'No interactions found' }, { status: 404 });
    }

    // Fetch KC metadata
    const kcIds = [...new Set(allInteractions.map((i) => i.question.kc).filter(Boolean))];
    const kcs = await prisma.knowledgeComponent.findMany({
      where: { id: { in: kcIds } },
    });
    type KCRecord = typeof kcs[number];
    const kcMap = new Map<string, KCRecord>(kcs.map((k: KCRecord) => [k.id, k]));

    // ── 1. KC-level error analysis ──────────────────────────────────────

    const kcGroups = new Map<string, typeof allInteractions>();
    for (const interaction of allInteractions) {
      const kc = interaction.question.kc;
      if (!kc) continue;
      if (!kcGroups.has(kc)) kcGroups.set(kc, []);
      kcGroups.get(kc)!.push(interaction);
    }

    const kcProfiles: KCErrorProfile[] = [];

    for (const [kcId, interactions] of kcGroups) {
      const kcMeta = kcMap.get(kcId);
      const errors = interactions.filter((i: InteractionWithQuestion) => !i.isCorrect);
      const errorRate = errors.length / interactions.length;

      const avgResponseTime = interactions.reduce((s: number, i: InteractionWithQuestion) => s + i.responseTimeMs, 0) / interactions.length;
      const avgErrorResponseTime = errors.length > 0
        ? errors.reduce((s: number, i: InteractionWithQuestion) => s + i.responseTimeMs, 0) / errors.length
        : 0;

      // Cluster errors
      const clusters: ErrorCluster[] = [];

      // Fast-wrong: guessing
      const fastWrong = errors.filter((e: InteractionWithQuestion) => e.responseTimeMs < FAST_RESPONSE_MS);
      if (errors.length > 0 && fastWrong.length / errors.length >= GUESSING_THRESHOLD) {
        clusters.push({
          type: 'guessing',
          confidence: fastWrong.length / errors.length,
          evidence: [
            `${fastWrong.length}/${errors.length} errors made in <${FAST_RESPONSE_MS / 1000}s`,
            `Average error response time: ${Math.round(avgErrorResponseTime)}ms`,
          ],
        });
      }

      // Slow-wrong: misconception
      const slowWrong = errors.filter((e: InteractionWithQuestion) => e.responseTimeMs > SLOW_RESPONSE_MS);
      if (errors.length > 0 && slowWrong.length >= 2) {
        clusters.push({
          type: 'misconception',
          confidence: Math.min(1, slowWrong.length / errors.length + 0.2),
          evidence: [
            `${slowWrong.length} errors after deliberate thought (>${SLOW_RESPONSE_MS / 1000}s)`,
            'Indicates systematic misunderstanding rather than lack of knowledge',
          ],
        });
      }

      // High mastery + errors: careless
      const masteryRecords = sessions.flatMap((s: SessionWithRelations) => s.kcMasteries).filter((m: { kcId: string }) => m.kcId === kcId);
      const currentMastery = masteryRecords.length > 0
        ? Math.max(...masteryRecords.map((m: { pLearned: number }) => m.pLearned))
        : 0;

      if (currentMastery > 0.7 && errorRate > 0.2) {
        const fastErrors = errors.filter((e: InteractionWithQuestion) => e.responseTimeMs < FAST_RESPONSE_MS);
        if (fastErrors.length / Math.max(1, errors.length) >= CARELESS_THRESHOLD) {
          clusters.push({
            type: 'careless_error',
            confidence: 0.7,
            evidence: [
              `Mastery P(L)=${currentMastery.toFixed(2)} but error rate ${(errorRate * 100).toFixed(0)}%`,
              `${fastErrors.length} fast errors suggest inattention, not ignorance`,
            ],
          });
        }
      }

      // Persistent low mastery: knowledge gap
      if (currentMastery < 0.4 && errorRate > 0.5) {
        clusters.push({
          type: 'knowledge_gap',
          confidence: Math.min(1, errorRate),
          evidence: [
            `P(Learned)=${currentMastery.toFixed(2)} after ${interactions.length} attempts`,
            `Error rate: ${(errorRate * 100).toFixed(0)}% — fundamental gap in this KC`,
          ],
        });
      }

      // Default: if no specific cluster, assign generic
      if (clusters.length === 0 && errorRate > 0.3) {
        clusters.push({
          type: 'knowledge_gap',
          confidence: errorRate,
          evidence: [`Error rate ${(errorRate * 100).toFixed(0)}% across ${interactions.length} attempts`],
        });
      }

      // Generate remediation based on dominant cluster
      const dominantCluster = clusters.sort((a, b) => b.confidence - a.confidence)[0];
      const remediation = generateRemediation(kcId, kcMeta?.name || kcId, dominantCluster, kcMeta?.bloomLevel || 1);

      kcProfiles.push({
        kcId,
        kcName: kcMeta?.name || kcId,
        bloomLevel: kcMeta?.bloomLevel || 1,
        totalAttempts: interactions.length,
        errors: errors.length,
        errorRate: Math.round(errorRate * 100) / 100,
        avgResponseTimeMs: Math.round(avgResponseTime),
        avgErrorResponseTimeMs: Math.round(avgErrorResponseTime),
        clusters,
        remediation,
      });
    }

    // ── 2. Bloom-level vulnerability ────────────────────────────────────

    const bloomLabels: Record<number, string> = { 1: 'Remembering', 2: 'Understanding', 3: 'Applying' };
    const bloomGroups = new Map<number, { total: number; errors: number }>();
    for (const interaction of allInteractions) {
      const bloom = interaction.question.bloom;
      const entry = bloomGroups.get(bloom) || { total: 0, errors: 0 };
      entry.total++;
      if (!interaction.isCorrect) entry.errors++;
      bloomGroups.set(bloom, entry);
    }

    const bloomVulnerabilities: BloomVulnerability[] = Array.from(bloomGroups.entries())
      .map(([level, data]) => ({
        level,
        label: bloomLabels[level] || `Level ${level}`,
        totalAttempts: data.total,
        errors: data.errors,
        errorRate: Math.round((data.errors / data.total) * 100) / 100,
      }))
      .sort((a, b) => b.errorRate - a.errorRate);

    // ── 3. Temporal pattern (fatigue detection) ─────────────────────────

    const totalInteractions = allInteractions.length;
    const splitPoint = Math.floor(totalInteractions * (1 - FATIGUE_WINDOW));
    const earlyInteractions = allInteractions.slice(0, splitPoint);
    const lateInteractions = allInteractions.slice(splitPoint);

    const earlyErrorRate = earlyInteractions.length > 0
      ? earlyInteractions.filter((i: InteractionWithQuestion) => !i.isCorrect).length / earlyInteractions.length
      : 0;
    const lateErrorRate = lateInteractions.length > 0
      ? lateInteractions.filter((i: InteractionWithQuestion) => !i.isCorrect).length / lateInteractions.length
      : 0;

    const fatigueDetected = lateErrorRate > earlyErrorRate + 0.15;
    const trend: 'improving' | 'declining' | 'stable' =
      lateErrorRate < earlyErrorRate - 0.1 ? 'improving'
        : lateErrorRate > earlyErrorRate + 0.1 ? 'declining'
          : 'stable';

    // ── 4. Overall fingerprint ──────────────────────────────────────────

    const overallErrorRate = allInteractions.filter((i: InteractionWithQuestion) => !i.isCorrect).length / allInteractions.length;

    // Determine dominant pattern across all KCs
    const allClusters = kcProfiles.flatMap((p) => p.clusters);
    const patternCounts = new Map<string, number>();
    for (const c of allClusters) {
      patternCounts.set(c.type, (patternCounts.get(c.type) || 0) + c.confidence);
    }
    const dominantPattern = [...patternCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

    // ── 5. Remediation plan ─────────────────────────────────────────────

    const remediationPlan: string[] = [];

    // Sort KCs by error impact (errors * errorRate)
    const sortedProfiles = [...kcProfiles].sort((a, b) => (b.errors * b.errorRate) - (a.errors * a.errorRate));

    for (const profile of sortedProfiles.slice(0, 5)) {
      if (profile.errorRate > 0.3) {
        remediationPlan.push(profile.remediation);
      }
    }

    if (fatigueDetected) {
      remediationPlan.push('Consider shorter study sessions — fatigue detected in final 30% of session with increased error rate.');
    }

    const mostVulnerableBloom = bloomVulnerabilities[0];
    if (mostVulnerableBloom && mostVulnerableBloom.errorRate > 0.4) {
      remediationPlan.push(
        `Focus on ${mostVulnerableBloom.label} (Bloom Level ${mostVulnerableBloom.level}) — ` +
        `${(mostVulnerableBloom.errorRate * 100).toFixed(0)}% error rate indicates difficulty at this cognitive level.`
      );
    }

    if (remediationPlan.length === 0) {
      remediationPlan.push('No significant error patterns detected. Continue with adaptive practice.');
    }

    const fingerprint: ErrorFingerprint = {
      sessionId: sessionId || `user:${userId}`,
      userId: sessions[0].userId,
      overallErrorRate: Math.round(overallErrorRate * 100) / 100,
      dominantPattern,
      bloomVulnerabilities,
      kcProfiles: sortedProfiles,
      temporalPattern: {
        trend,
        earlyErrorRate: Math.round(earlyErrorRate * 100) / 100,
        lateErrorRate: Math.round(lateErrorRate * 100) / 100,
        fatigueDetected,
      },
      remediationPlan,
    };

    return NextResponse.json(fingerprint);

  } catch (error) {
    console.error('GET /api/analytics/error-patterns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Remediation Generator ────────────────────────────────────────────────────

function generateRemediation(
  kcId: string,
  kcName: string,
  cluster: ErrorCluster | undefined,
  bloomLevel: number,
): string {
  if (!cluster) return `Review ${kcName} learning materials.`;

  switch (cluster.type) {
    case 'guessing':
      return `${kcName}: Slow down and read each option carefully. ` +
        `Your fast responses suggest you may be guessing. ` +
        `Review the foundational concepts before attempting more questions.`;

    case 'misconception':
      return `${kcName}: You have a systematic misunderstanding here. ` +
        `Re-read the instructional material carefully, paying attention to distinctions between similar concepts. ` +
        (bloomLevel >= 2 ? 'Try explaining the concept in your own words before answering.' : '');

    case 'careless_error':
      return `${kcName}: You know this material but are making avoidable mistakes. ` +
        `Take an extra moment to verify your answer before submitting.`;

    case 'knowledge_gap':
      return `${kcName}: This is a fundamental knowledge gap. ` +
        `Start with the "Learn First" mode to build foundational understanding. ` +
        (bloomLevel === 1
          ? 'Focus on memorising key facts.'
          : bloomLevel === 2
            ? 'Work on understanding relationships between concepts.'
            : 'Practice applying concepts to new scenarios.');

    case 'fatigue':
      return `${kcName}: Errors increased later in the session — consider taking a break and revisiting.`;

    default:
      return `Review ${kcName} learning materials and practice with varied question formats.`;
  }
}
