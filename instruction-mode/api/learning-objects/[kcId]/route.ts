// app/api/learning-objects/[kcId]/route.ts
// Fetches learning content for a specific Knowledge Component

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { kcId: string } }
) {
  try {
    const { kcId } = params;

    // Fetch learning objects for this KC
    const learningObjects = await prisma.learningObject.findMany({
      where: {
        knowledgeComponentId: kcId,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    if (learningObjects.length === 0) {
      return NextResponse.json(
        { error: 'No learning content found for this topic' },
        { status: 404 }
      );
    }

    // Fetch the KC details including prerequisites
    const knowledgeComponent = await prisma.knowledgeComponent.findUnique({
      where: { id: kcId },
      include: {
        dependentOn: {
          include: {
            fromKC: true,
          },
        },
      },
    });

    // Check if user has mastered prerequisites (if session provided)
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    let prerequisiteStatus: { kcId: string; name: string; mastered: boolean }[] = [];

    if (sessionId && knowledgeComponent?.dependentOn) {
      // Get user's mastery levels for prerequisite KCs
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          interactions: {
            include: {
              question: true,
            },
          },
        },
      });

      if (session) {
        // Calculate mastery for each prerequisite KC
        for (const edge of knowledgeComponent.dependentOn) {
          const prereqKcId = edge.fromKCId;
          const prereqInteractions = session.interactions.filter(
            (i) => i.question.knowledgeComponentId === prereqKcId
          );
          
          const correctCount = prereqInteractions.filter((i) => i.correct).length;
          const totalCount = prereqInteractions.length;
          const mastery = totalCount > 0 ? correctCount / totalCount : 0;

          prerequisiteStatus.push({
            kcId: prereqKcId,
            name: edge.fromKC.name,
            mastered: mastery >= edge.masteryThreshold,
          });
        }
      }
    }

    return NextResponse.json({
      learningObjects,
      knowledgeComponent: knowledgeComponent
        ? {
            id: knowledgeComponent.id,
            name: knowledgeComponent.name,
            description: knowledgeComponent.description,
            bloomLevel: knowledgeComponent.bloomLevel,
          }
        : null,
      prerequisiteStatus,
    });
  } catch (error) {
    console.error('Error fetching learning objects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning content' },
      { status: 500 }
    );
  }
}
