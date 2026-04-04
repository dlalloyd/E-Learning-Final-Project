/**
 * POST /api/assessments/[id]/answer
 * Submits an answer for a pre/post/delayed assessment question.
 *
 * Unlike the main session answer route, assessments do NOT update IRT theta
 * or BKT mastery — they are purely measurement instruments.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = params.id;
    const body = await req.json();
    const { questionId, selectedAnswer, optionsMap } = body;

    if (!questionId || !selectedAnswer) {
      return NextResponse.json(
        { error: 'questionId and selectedAnswer are required' },
        { status: 400 }
      );
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    if (assessment.completedAt) {
      return NextResponse.json({ error: 'Assessment already completed' }, { status: 400 });
    }

    // Check if question already answered in this assessment
    const existingAnswer = await prisma.answer.findFirst({
      where: { assessmentId, questionId },
    });
    if (existingAnswer) {
      return NextResponse.json({ error: 'Question already answered' }, { status: 400 });
    }

    // Determine correctness — variant-based (same logic as session answer route)
    const variant = await prisma.questionVariant.findUnique({
      where: { id: questionId },
    });

    let isCorrect = false;
    let correctLabel = '';

    if (variant) {
      const correctAnswerText = variant.correctAnswer;
      if (optionsMap && typeof optionsMap === 'object') {
        const matchingEntry = Object.entries(optionsMap as Record<string, string>)
          .find(([, text]) => text === correctAnswerText);
        correctLabel = matchingEntry ? matchingEntry[0].toUpperCase() : 'A';
      } else {
        correctLabel = selectedAnswer.toUpperCase();
      }
      isCorrect = selectedAnswer.toUpperCase() === correctLabel;
    } else {
      // Legacy question fallback
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { options: { orderBy: { order: 'asc' } } },
      });
      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
      const labels = ['A', 'B', 'C', 'D'];
      const correctIdx = question.options.findIndex((o: { isCorrect: boolean }) => o.isCorrect);
      correctLabel = correctIdx >= 0 ? labels[correctIdx] : 'A';
      isCorrect = selectedAnswer.toUpperCase() === correctLabel;
    }

    // Store answer
    await prisma.answer.create({
      data: {
        assessmentId,
        questionId,
        textAnswer: selectedAnswer.toUpperCase(),
        isCorrect,
      },
    });

    return NextResponse.json({
      correct: isCorrect,
      correctAnswer: correctLabel,
      selectedAnswer: selectedAnswer.toUpperCase(),
    });

  } catch (error) {
    console.error('POST /api/assessments/[id]/answer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
