/**
 * GET /api/assessments/[id]/next-question
 * Serves the next question for a pre/post/delayed assessment.
 *
 * Assessment questions are drawn from QuestionTemplates with ONE variant per KC,
 * presented in fixed random order (not adaptive) to ensure valid comparison
 * across pre/post/delayed conditions.
 *
 * Key design:
 *   - Static ordering (no IRT selection) — assessments must be equivalent
 *   - One question per KC for balanced coverage
 *   - Different variant per assessment type to prevent memorisation
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

function shuffleWithSeed<T>(arr: T[], seed: string): T[] {
  // Simple deterministic shuffle based on assessment ID
  const a = [...arr];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  for (let i = a.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0;
    const j = Math.abs(hash) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = params.id;

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        answers: { select: { questionId: true } },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    if (assessment.completedAt) {
      return NextResponse.json({
        completed: true,
        score: assessment.score,
        maxScore: assessment.maxScore,
        passed: assessment.passed,
      });
    }

    const answeredQuestionIds = new Set(assessment.answers.map((a: { questionId: string }) => a.questionId));

    // Get all templates with their variants, grouped by KC
    const templates = await prisma.questionTemplate.findMany({
      include: { variants: true },
    });

    // Select one template per KC (pick the one matching Bloom level 1 for pre-test, vary for post)
    const kcTemplateMap = new Map<string, typeof templates[0]>();
    for (const template of templates) {
      const existing = kcTemplateMap.get(template.kcId);
      if (!existing) {
        kcTemplateMap.set(template.kcId, template);
      } else {
        // For pre-test: prefer Bloom level 1 (remembering)
        // For post-test/delayed: prefer Bloom level 2+ to test deeper understanding
        const preferredBloom = assessment.type === 'pre_test' ? 1 : 2;
        if (Math.abs(template.bloomLevel - preferredBloom) < Math.abs(existing.bloomLevel - preferredBloom)) {
          kcTemplateMap.set(template.kcId, template);
        }
      }
    }

    // Build question list with deterministic order based on assessment ID
    const kcTemplates = Array.from(kcTemplateMap.values());
    const orderedTemplates = shuffleWithSeed(kcTemplates, assessmentId);

    // Pick a variant for each template based on assessment type
    // Pre-test uses variant index 0, post-test uses 1, delayed uses 2 (wrapping)
    const typeIndex = assessment.type === 'pre_test' ? 0 : assessment.type === 'post_test' ? 1 : 2;

    // Find next unanswered question
    for (const template of orderedTemplates) {
      if (template.variants.length === 0) continue;
      const variantIdx = typeIndex % template.variants.length;
      const variant = template.variants[variantIdx];

      // Skip if already answered
      if (answeredQuestionIds.has(variant.id)) continue;

      // Render the question
      const variables = (variant.variables as Record<string, string>) || {};
      let text = template.templateText;
      for (const [key, value] of Object.entries(variables)) {
        text = text.replace(new RegExp('\\{' + key + '\\}', 'g'), value);
      }

      const distractorsRaw = variant.distractors;
      const distractors: string[] = Array.isArray(distractorsRaw)
        ? (distractorsRaw as string[])
        : Object.values(distractorsRaw as Record<string, string>);

      // Shuffle options
      const pool = shuffleArray([variant.correctAnswer, ...distractors.slice(0, 3)]);
      const labels = ['A', 'B', 'C', 'D'];
      const options: Record<string, string> = {};
      pool.forEach((optText, i) => {
        options[labels[i]] = optText;
      });

      return NextResponse.json({
        questionId: variant.id,
        text,
        options,
        bloom: template.bloomLevel,
        kc: template.kcId,
        meta: {
          questionsAnswered: answeredQuestionIds.size,
          questionsRemaining: Math.max(0, orderedTemplates.length - answeredQuestionIds.size),
          assessmentType: assessment.type,
        },
      });
    }

    // All questions answered — complete the assessment
    const answers = await prisma.answer.findMany({
      where: { assessmentId },
    });
    const correctCount = answers.filter((a: { isCorrect: boolean | null }) => a.isCorrect).length;
    const score = correctCount / Math.max(1, answers.length);

    await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        completedAt: new Date(),
        score,
        maxScore: answers.length,
        passed: score >= 0.7,
      },
    });

    return NextResponse.json({
      completed: true,
      score: Math.round(score * 100) / 100,
      maxScore: answers.length,
      correctCount,
      passed: score >= 0.7,
    });

  } catch (error) {
    console.error('GET /api/assessments/[id]/next-question error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
