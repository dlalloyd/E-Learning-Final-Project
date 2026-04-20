import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { kcId: string } }
) {
  try {
    const { kcId } = params;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const kc = await prisma.knowledgeComponent.findUnique({
      where: { id: kcId },
    });

    if (!kc) {
      return NextResponse.json(
        { error: 'Knowledge component not found' },
        { status: 404 }
      );
    }

    const learningObjects = await prisma.learningObject.findMany({
      where: { knowledgeComponentId: kcId },
      orderBy: { orderIndex: 'asc' },
    });

    let prerequisiteStatus: Array<{ kcId: string; name: string; mastered: boolean }> = [];

    if (sessionId) {
      const prereqEdges = await prisma.prerequisiteEdge.findMany({
        where: { toKCId: kcId },
        include: { fromKC: true },
      });

      prerequisiteStatus = prereqEdges.map((edge: typeof prereqEdges[number]) => ({
        kcId: edge.fromKCId,
        name: edge.fromKC.name,
        mastered: false,
      }));
    }

    return NextResponse.json({
      learningObjects,
      knowledgeComponent: kc,
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
