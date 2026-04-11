/**
 * Research Data Collection API
 *
 * Handles:
 * - Research consent form (demographics + consent)
 * - Full data export for dissertation analysis
 * - SUS questionnaire submission
 *
 * Data collected per participant (if consent given):
 * 1. Demographics: age range, prior geography knowledge
 * 2. Behavioural traces: all interactions, response times, hint usage
 * 3. Learning outcomes: pre-test -> post-test -> delayed post-test scores
 * 4. Adaptive engine data: theta trajectory, BKT mastery progression
 * 5. Engagement: session count, time-on-task, elaboration responses
 * 6. Usability: SUS score
 * 7. Qualitative: elaboration responses, self-assessment ratings
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getAuthFromCookie } from '@/lib/auth/jwt';

// POST /api/research - submit consent form
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { consentGiven, ageRange, priorGeoKnowledge } = await req.json();

    // Generate anonymised participant ID
    const existingCount = await prisma.researchConsent.count();
    const participantId = `P${String(existingCount + 1).padStart(2, '0')}`;

    const consent = await prisma.researchConsent.upsert({
      where: { userId: auth.userId },
      create: {
        userId: auth.userId,
        consentGiven: consentGiven === true,
        consentDate: consentGiven ? new Date() : null,
        participantId,
        ageRange: ageRange || null,
        priorGeoKnowledge: priorGeoKnowledge || null,
      },
      update: {
        consentGiven: consentGiven === true,
        consentDate: consentGiven ? new Date() : null,
        ageRange: ageRange || null,
        priorGeoKnowledge: priorGeoKnowledge || null,
      },
    });

    return NextResponse.json({ participantId: consent.participantId, saved: true });
  } catch (error) {
    console.error('POST /api/research error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/research?export=true - full anonymised data export for dissertation
export async function GET(req: NextRequest) {
  try {
    const exportMode = req.nextUrl.searchParams.get('export') === 'true';

    if (!exportMode) {
      // Just check if current user has consented
      const auth = getAuthFromCookie();
      if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const consent = await prisma.researchConsent.findUnique({
        where: { userId: auth.userId },
      });
      return NextResponse.json({ consent });
    }

    // Full export - all consented participants
    const consented = await prisma.researchConsent.findMany({
      where: { consentGiven: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const participants: any[] = [];

    for (const consent of consented) {
      const userId = consent.userId;

      // Sessions
      const sessions = await prisma.session.findMany({
        where: { userId },
        include: {
          interactions: {
            select: {
              isCorrect: true, responseTimeMs: true, pLearned_before: true,
              pLearned_after: true, theta_before: true, theta_after: true,
              cognitiveLoad: true, hintsUsed: true, hintLevelMax: true,
              question: { select: { bloom: true, kc: true } },
            },
          },
          kcMasteries: true,
        },
        orderBy: { startedAt: 'asc' },
      });

      // Assessments
      const assessments = await prisma.assessment.findMany({
        where: { userId },
        select: {
          type: true, score: true, maxScore: true, thetaAtTime: true,
          completedAt: true,
        },
        orderBy: { startedAt: 'asc' },
      });

      // Elaboration responses
      const elaborations = await prisma.elaborationResponse.findMany({
        where: { userId },
        select: {
          kcId: true, prompt: true, response: true, responseTimeMs: true,
        },
      });

      // SUS scores
      const sus = await prisma.sUSResponse.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      // Goals
      const goals = await prisma.learnerGoal.findMany({
        where: { userId },
      });

      // Study schedule adherence
      const schedules = await prisma.studySchedule.findMany({
        where: { userId },
      });
      const scheduledTotal = schedules.length;
      const scheduledCompleted = schedules.filter((s) => s.completed).length;
      const scheduledSkipped = schedules.filter((s) => s.skipped).length;

      participants.push({
        participantId: consent.participantId,
        demographics: {
          ageRange: consent.ageRange,
          priorGeoKnowledge: consent.priorGeoKnowledge,
          consentDate: consent.consentDate,
        },
        sessions: sessions.map((s) => ({
          condition: s.condition,
          startedAt: s.startedAt,
          completedAt: s.completedAt,
          finalTheta: s.theta,
          totalQuestions: s.interactions.length,
          correct: s.interactions.filter((i) => i.isCorrect).length,
          avgResponseTimeMs: s.interactions.length > 0
            ? Math.round(s.interactions.reduce((sum, i) => sum + i.responseTimeMs, 0) / s.interactions.length)
            : 0,
          hintsUsed: s.interactions.reduce((sum, i) => sum + i.hintsUsed, 0),
          avgCognitiveLoad: s.interactions.filter((i) => i.cognitiveLoad).length > 0
            ? s.interactions.filter((i) => i.cognitiveLoad).reduce((sum, i) => sum + (i.cognitiveLoad || 0), 0) /
              s.interactions.filter((i) => i.cognitiveLoad).length
            : null,
          kcMasteries: s.kcMasteries.map((m) => ({
            kcId: m.kcId,
            pLearned: m.pLearned,
            masteredAt: m.masteredAt,
          })),
          // Per-question detail
          interactions: s.interactions.map((i) => ({
            bloom: i.question.bloom,
            kc: i.question.kc,
            correct: i.isCorrect,
            responseTimeMs: i.responseTimeMs,
            thetaDelta: i.theta_after - i.theta_before,
            pLearnedDelta: i.pLearned_after - i.pLearned_before,
            cognitiveLoad: i.cognitiveLoad,
            hintsUsed: i.hintsUsed,
            hintLevelMax: i.hintLevelMax,
          })),
        })),
        assessments,
        elaborations,
        susScore: sus[0]?.susScore ?? null,
        goals: goals.map((g) => ({
          type: g.goalType,
          target: g.targetValue,
          achieved: g.achieved,
        })),
        studyScheduleAdherence: {
          total: scheduledTotal,
          completed: scheduledCompleted,
          skipped: scheduledSkipped,
          adherenceRate: scheduledTotal > 0
            ? Math.round((scheduledCompleted / scheduledTotal) * 100) / 100
            : null,
        },
      });
    }

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      totalParticipants: participants.length,
      participants,
    });
  } catch (error) {
    console.error('GET /api/research error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
