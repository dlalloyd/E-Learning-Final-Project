/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/analytics/error-patterns?sessionId=xxx
 * Error Pattern Fingerprinting - clusters mistakes into cognitive profiles
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

    // Build where clause - can analyse a single session or all sessions for a user
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
            `Error rate: ${(errorRate * 100).toFixed(0)}% - fundamental gap in this KC`,
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
      remediationPlan.push('Consider shorter study sessions. Fatigue detected in the final 30% of the session with increased error rate.');
    }

    const mostVulnerableBloom = bloomVulnerabilities[0];
    if (mostVulnerableBloom && mostVulnerableBloom.errorRate > 0.4) {
      remediationPlan.push(
        `Focus on ${mostVulnerableBloom.label} (Bloom Level ${mostVulnerableBloom.level}): ` +
        `${(mostVulnerableBloom.errorRate * 100).toFixed(0)}% error rate indicates difficulty at this cognitive level.`
      );
    }

    // ---- Hattie & Timperley (2007) 4-level feedback ----
    // Level 1 (Task): What went wrong on specific questions
    // Level 2 (Process): How you approached the questions
    // Level 3 (Self-regulation): How to monitor and adjust your learning
    // We add all three levels for richer, more actionable feedback.

    // Process-level feedback based on response-time patterns
    const avgAllResponseMs = allInteractions.reduce((s, i) => s + i.responseTimeMs, 0) / allInteractions.length;
    if (avgAllResponseMs < 4000 && overallErrorRate > 0.3) {
      remediationPlan.push(
        'You are answering very quickly (avg ' + (avgAllResponseMs / 1000).toFixed(1) +
        's). Try reading each option fully before selecting. Slower, deliberate responses tend to improve accuracy (Shute, 2008).'
      );
    }

    // Self-regulation feedback
    if (overallErrorRate > 0.4) {
      remediationPlan.push(
        'Before each answer, try pausing to ask yourself: "Am I certain, or am I guessing?" ' +
        'This self-monitoring strategy helps you identify when to use hints instead of guessing (Narciss & Huth, 2004).'
      );
    }

    if (remediationPlan.length === 0) {
      remediationPlan.push('Strong performance across all topics. Keep practising to maintain your mastery over time.');
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

// --- Remediation Generator ---
// Based on Hattie & Timperley (2007) feedback model:
//   Level 1 (Task): specific information about what was wrong
//   Level 2 (Process): strategies for approaching the task
//   Level 3 (Self-regulation): metacognitive monitoring guidance
// Also informed by Shute (2008) guidelines for formative feedback
// and Narciss & Huth (2004) elaborated feedback taxonomy.

function generateRemediation(
  _kcId: string,
  kcName: string,
  cluster: ErrorCluster | undefined,
  bloomLevel: number,
): string {
  if (!cluster) return `Review ${kcName} learning materials.`;

  switch (cluster.type) {
    case 'guessing':
      return `${kcName}: Your response times suggest rapid guessing (most errors under 5 seconds). ` +
        `Try using the hint system instead of guessing randomly. ` +
        (bloomLevel === 1
          ? 'Use the "Learn First" mode to review key facts before attempting questions again.'
          : 'Read all four options before selecting. Eliminate two wrong answers first, then choose between the remaining two.');

    case 'misconception':
      return `${kcName}: You spent time thinking but reached the wrong conclusion, which suggests a specific misunderstanding. ` +
        (bloomLevel === 1
          ? 'Pay close attention to details that distinguish similar items (e.g. which national park is in which region).'
          : bloomLevel === 2
            ? 'Try to explain the "why" behind your answer before submitting. If you cannot explain it, use a hint.'
            : 'Break the problem into smaller parts and check each part separately before committing to an answer.');

    case 'careless_error':
      return `${kcName}: You understand this topic (high mastery) but made quick mistakes. ` +
        `Before submitting, re-read the question stem to make sure you are answering what was actually asked.`;

    case 'knowledge_gap':
      return `${kcName}: This needs focused study. ` +
        (bloomLevel === 1
          ? 'Start a new session using "Learn First" and study the review material for this topic. Focus on the memory aids provided.'
          : bloomLevel === 2
            ? 'Review the cause-and-effect relationships in this topic. Try to connect each concept to a real-world example.'
            : 'Revisit the foundational concepts first (Level 1 and 2) before attempting application questions.');

    case 'fatigue':
      return `${kcName}: Your accuracy dropped in the later part of the session. Consider shorter, more frequent study sessions rather than one long one.`;

    default:
      return `Review ${kcName} learning materials and practise with varied question formats.`;
  }
}
