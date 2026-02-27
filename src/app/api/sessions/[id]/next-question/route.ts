/**
 * GET /api/sessions/[id]/next-question
 * Selects the next question using IRT maximum information criterion
 * For adaptive condition: selects item with highest information at current θ
 * For static condition: selects next question by fixed order
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { selectNextQuestion, itemInformation } from '@/lib/algorithms/irt';
import type { IRTQuestion } from '@/lib/algorithms/irt';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    // Load session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { interactions: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.completedAt) {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
    }

    // Get all questions for this quiz with IRT parameters
    const questions = await prisma.question.findMany({
      where: { quizId: session.quizId },
      include: { options: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    });

    if (questions.length === 0) {
      return NextResponse.json({ error: 'No questions found for this quiz' }, { status: 404 });
    }

    // IDs already answered in this session
    const answeredIds = session.interactions.map((i) => i.questionId);

    // Check if all questions answered
    if (answeredIds.length >= questions.length) {
      // Mark session complete
      await prisma.session.update({
        where: { id: sessionId },
        data: { completedAt: new Date() },
      });
      return NextResponse.json({
        completed: true,
        message: 'All questions answered — session complete',
        finalTheta: session.theta,
        totalAnswered: answeredIds.length,
      });
    }

    // Map Prisma questions to IRTQuestion format
    const irtQuestions: IRTQuestion[] = questions.map((q) => {
      // Build options map from DB options
      const optionsMap: Record<string, string> = {};
      const labels = ['A', 'B', 'C', 'D'];
      q.options.forEach((opt, idx) => {
        if (idx < 4) optionsMap[labels[idx]] = opt.text;
      });

      // Find correct answer label
      const correctIdx = q.options.findIndex((o) => o.isCorrect);
      const correctLabel = correctIdx >= 0 ? labels[correctIdx] : 'A';

      return {
        id: q.id,
        text: q.text,
        options: optionsMap,
        correct: correctLabel,
        bloom: (q.bloom as 1 | 2 | 3) || 1,
        kc: q.kc || '',
        a: q.irt_a,
        b: q.irt_b,
        c: q.irt_c,
      };
    });

    let selectedQuestion: IRTQuestion | null = null;

    if (session.condition === 'adaptive') {
      // ADAPTIVE: maximum information criterion at current θ
      selectedQuestion = selectNextQuestion(irtQuestions, {
        targetTheta: session.theta,
        excludeIds: answeredIds,
      });
    } else {
      // STATIC: fixed order (control condition — Khan Academy style)
      const remaining = irtQuestions.filter((q) => !answeredIds.includes(q.id));
      selectedQuestion = remaining.length > 0 ? remaining[0] : null;
    }

    if (!selectedQuestion) {
      return NextResponse.json({ error: 'No eligible questions remaining' }, { status: 404 });
    }

    // Calculate information value at current θ (for logging/dissertation evidence)
    const infoAtTheta = itemInformation(session.theta, selectedQuestion);

    // Return question WITHOUT the correct answer (client must not know)
    return NextResponse.json({
      questionId: selectedQuestion.id,
      text: selectedQuestion.text,
      options: selectedQuestion.options,
      bloom: selectedQuestion.bloom,
      kc: selectedQuestion.kc,
      // IRT metadata for transparency (shown in admin view, not learner view)
      meta: {
        currentTheta: session.theta,
        itemDifficulty: selectedQuestion.b,
        itemInformation: Math.round(infoAtTheta * 1000) / 1000,
        questionsAnswered: answeredIds.length,
        questionsRemaining: questions.length - answeredIds.length,
        condition: session.condition,
      },
    });

  } catch (error) {
    console.error('GET /api/sessions/[id]/next-question error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}