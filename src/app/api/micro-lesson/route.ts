/**
 * Misconception-Targeted Micro-Lessons API (Feature 11)
 *
 * When the error fingerprint identifies a specific misconception
 * (e.g. confusing two national parks), generate a targeted 60-second
 * comparison lesson that addresses THAT specific confusion.
 *
 * GET ?kcId=X&sessionId=Y - returns a micro-lesson based on the
 * learner's specific errors in that KC.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

// Pre-built micro-lesson templates keyed by KC + common confusion pair
const MICRO_LESSONS: Record<string, { title: string; content: string }[]> = {
  UK_national_parks: [
    {
      title: 'Snowdonia vs Brecon Beacons',
      content: `**Both are in Wales, but in very different locations.**

| | Snowdonia | Brecon Beacons |
|---|---|---|
| Location | North Wales | South Wales |
| Highest Peak | Snowdon (1,085m) | Pen y Fan (886m) |
| Character | Rugged mountains, slate quarries | Rolling hills, waterfalls |
| Key Fact | Contains Wales' highest mountain | Closest national park to Cardiff |

**Memory trick:** "S for Snowdonia, S for Scotland-side" - Snowdonia is in the north, closer to the Scottish border.`,
    },
    {
      title: 'Lake District vs Yorkshire Dales',
      content: `**Both are in northern England, but on different sides of the Pennines.**

| | Lake District | Yorkshire Dales |
|---|---|---|
| Location | North-west England (Cumbria) | North-east of the Pennines |
| Known For | Lakes (Windermere, Ullswater) | Limestone scenery, dry stone walls |
| Highest Peak | Scafell Pike (978m) - England's highest | Whernside (736m) |
| Visitors | ~19 million/year (most visited) | ~9 million/year |

**Memory trick:** "Lakes are Left (west), Dales are Right (east)" when looking at a map.`,
    },
    {
      title: 'Peak District vs North York Moors',
      content: `**Both are in central-northern England but have completely different landscapes.**

| | Peak District | North York Moors |
|---|---|---|
| Location | Central England (Derbyshire) | North-east coast |
| Founded | 1951 (first UK national park) | 1952 |
| Landscape | Gritstone edges, limestone dales | Heather moorland |
| Key Fact | Between Manchester and Sheffield | On the coast near Whitby |

**Memory trick:** "Peak was first (1951), Peaks are central" - right in the middle of England.`,
    },
  ],
  UK_rivers: [
    {
      title: 'Severn vs Thames - Which is Longest?',
      content: `**The Severn is the longest river in the UK, not the Thames.**

| | River Severn | River Thames |
|---|---|---|
| Length | 354 km (longest) | 346 km (second longest) |
| Source | Plynlimon, Wales | Kemble, Gloucestershire |
| Flows Through | Wales into England | Southern England to London |
| Empties Into | Bristol Channel (west) | North Sea (east) |

**Memory trick:** "S before T in the alphabet, Severn before Thames in length" (354 > 346).
The Severn starts in Wales and flows east. The Thames stays in England and flows east through London.`,
    },
  ],
  UK_mountains: [
    {
      title: 'The Three Highest Peaks',
      content: `**Each UK nation has a different highest peak. Students often mix up the order.**

| Rank | Mountain | Nation | Height |
|---|---|---|---|
| 1st | Ben Nevis | Scotland | 1,345m |
| 2nd | Snowdon (Yr Wyddfa) | Wales | 1,085m |
| 3rd | Scafell Pike | England | 978m |

**Memory trick:** "BSS" - Ben Nevis, Snowdon, Scafell Pike (descending height).
Or: "Big Scottish Summits" - the biggest is in Scotland.

Note: Scafell Pike is in the Lake District (north-west England), NOT the Peak District (central England).`,
    },
  ],
  UK_capitals: [
    {
      title: 'Edinburgh vs Glasgow',
      content: `**Edinburgh is Scotland's capital, but Glasgow is the larger city.**

| | Edinburgh | Glasgow |
|---|---|---|
| Role | Capital of Scotland | Largest city in Scotland |
| Coast | East coast | West coast |
| Population | ~530,000 | ~635,000 |
| Known For | Castle, Royal Mile, Parliament | Shipbuilding, culture, music |

**Memory trick:** "E for Edinburgh, E for East" - the capital is on the east coast.
Cardiff became Wales' capital only in 1955 - the youngest capital in Western Europe.`,
    },
  ],
};

export async function GET(req: NextRequest) {
  try {
    const kcId = req.nextUrl.searchParams.get('kcId');
    const sessionId = req.nextUrl.searchParams.get('sessionId');

    if (!kcId) {
      return NextResponse.json({ error: 'kcId required' }, { status: 400 });
    }

    const lessons = MICRO_LESSONS[kcId] || [];

    // If we have a sessionId, try to match the lesson to the learner's specific errors
    if (sessionId && lessons.length > 0) {
      const wrongAnswers = await prisma.variantPresentation.findMany({
        where: { sessionId, isCorrect: false },
        include: {
          variant: {
            include: { template: { select: { kcId: true } } },
          },
        },
      });

      const kcErrors = wrongAnswers.filter((w) => w.variant.template.kcId === kcId);

      // Return the first relevant lesson (in future, could match by distractor analysis)
      if (kcErrors.length > 0) {
        return NextResponse.json({
          lesson: lessons[0],
          errorCount: kcErrors.length,
          allLessons: lessons,
        });
      }
    }

    // Fallback: return all micro-lessons for this KC
    return NextResponse.json({
      lesson: lessons.length > 0 ? lessons[0] : null,
      allLessons: lessons,
    });
  } catch (error) {
    console.error('GET /api/micro-lesson error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
