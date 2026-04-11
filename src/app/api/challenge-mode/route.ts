/**
 * Challenge Mode API (Feature 10) - Transfer Testing
 *
 * Novel-context questions that apply geography knowledge to unfamiliar
 * scenarios. Tests Bloom Level 3+ transfer rather than just recall.
 * These questions are NOT in the main question bank - they are separate
 * challenge items used after the learner demonstrates mastery.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookie } from '@/lib/auth/jwt';

interface ChallengeQuestion {
  id: string;
  text: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  kcsRequired: string[];
  bloomLevel: number;
}

const CHALLENGE_QUESTIONS: ChallengeQuestion[] = [
  {
    id: 'ch-001',
    text: 'A new weather station is being built on the western side of the Pennines. Based on UK climate patterns, what would you predict about its rainfall recordings compared to a station on the eastern side?',
    options: {
      A: 'Similar rainfall on both sides',
      B: 'Higher rainfall on the western side due to the rain shadow effect',
      C: 'Lower rainfall on the western side because westerly winds lose moisture over the sea',
      D: 'Higher rainfall on the eastern side due to proximity to the North Sea',
    },
    correctAnswer: 'B',
    explanation: 'The western side of the Pennines receives more rainfall because prevailing westerly winds carry moisture from the Atlantic. As air rises over the Pennines, it cools and releases rain (orographic rainfall). The eastern side sits in a "rain shadow" where the air descends, warms, and holds onto remaining moisture.',
    kcsRequired: ['pennines_rain_shadow', 'westerly_winds_rainfall'],
    bloomLevel: 3,
  },
  {
    id: 'ch-002',
    text: 'A tourist wants to visit the UK\'s oldest national park and the newest national park in the same trip. What two parks should they visit, and in which regions of England would they be travelling?',
    options: {
      A: 'Lake District (north-west) and South Downs (south-east)',
      B: 'Peak District (central) and South Downs (south)',
      C: 'Dartmoor (south-west) and The Broads (east)',
      D: 'Snowdonia (north Wales) and New Forest (south)',
    },
    correctAnswer: 'B',
    explanation: 'The Peak District was the first UK national park (designated 1951) and is located in central England between Manchester and Sheffield. The South Downs was the newest (designated 2010) and stretches across south-east England. This trip would take you from the middle of England to the south coast.',
    kcsRequired: ['UK_national_parks'],
    bloomLevel: 3,
  },
  {
    id: 'ch-003',
    text: 'Edinburgh and Cardiff are both capital cities, but they experience quite different climates. Using your knowledge of UK climate factors, which statement best explains why?',
    options: {
      A: 'Edinburgh is further north so it is always colder and wetter',
      B: 'Cardiff is sheltered by the Pennines so receives less rainfall',
      C: 'Edinburgh\'s east coast location means less rainfall from Atlantic westerlies, while Cardiff\'s west-facing position receives more',
      D: 'Cardiff benefits from the Gulf Stream while Edinburgh does not',
    },
    correctAnswer: 'C',
    explanation: 'Edinburgh sits on Scotland\'s east coast, partly sheltered from the prevailing westerly Atlantic winds, so it receives relatively low rainfall. Cardiff faces the Bristol Channel and the Atlantic to the west, receiving more of the maritime moisture. Both benefit from the North Atlantic Drift (Gulf Stream), but Edinburgh\'s east coast position is the key differentiator for rainfall.',
    kcsRequired: ['UK_capitals', 'westerly_winds_rainfall', 'maritime_continental'],
    bloomLevel: 3,
  },
  {
    id: 'ch-004',
    text: 'A geographer is mapping flood risk zones in the UK. Which of the following areas would they classify as HIGHEST risk, and why?',
    options: {
      A: 'The Scottish Highlands - steep terrain causes rapid runoff',
      B: 'The Thames Estuary - low-lying land, tidal influence, and high urbanisation',
      C: 'The Peak District - high rainfall and impermeable rock',
      D: 'The Pembrokeshire Coast - exposed to Atlantic storms',
    },
    correctAnswer: 'B',
    explanation: 'The Thames Estuary combines multiple flood risk factors: very low-lying land (some below sea level), tidal surges from the North Sea, high urbanisation with impermeable surfaces increasing runoff, and a large river catchment. This is why the Thames Barrier was built. While other areas flood, the combination of factors and population density makes the Thames Estuary the highest risk.',
    kcsRequired: ['UK_rivers', 'flood_risk_integration'],
    bloomLevel: 3,
  },
  {
    id: 'ch-005',
    text: 'If climate change causes sea levels to rise by 1 metre over the next century, which UK national park would be most directly affected, and what would the primary impact be?',
    options: {
      A: 'The Broads - low-lying wetlands would be inundated with saltwater',
      B: 'The Lake District - rising lake levels would flood valleys',
      C: 'Snowdonia - coastal erosion would reach the mountain foothills',
      D: 'The Peak District - increased rainfall would cause flooding',
    },
    correctAnswer: 'A',
    explanation: 'The Broads in Norfolk is the most vulnerable because it consists of low-lying wetlands, many barely above sea level. A 1m rise would introduce saltwater into freshwater ecosystems, destroying the unique habitat. The Lake District\'s lakes are fed by rainfall and at elevation, so sea level rise would not directly affect them. Snowdonia and the Peak District are at elevation.',
    kcsRequired: ['UK_national_parks', 'climate_change_application'],
    bloomLevel: 3,
  },
];

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const questionId = req.nextUrl.searchParams.get('questionId');

    if (questionId) {
      // Return specific question
      const q = CHALLENGE_QUESTIONS.find((cq) => cq.id === questionId);
      if (!q) return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      // Don't send correctAnswer or explanation until they answer
      return NextResponse.json({
        id: q.id,
        text: q.text,
        options: q.options,
        bloomLevel: q.bloomLevel,
        kcsRequired: q.kcsRequired,
      });
    }

    // Return all challenge questions (without answers)
    return NextResponse.json({
      questions: CHALLENGE_QUESTIONS.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        bloomLevel: q.bloomLevel,
        kcsRequired: q.kcsRequired,
      })),
      total: CHALLENGE_QUESTIONS.length,
    });
  } catch (error) {
    console.error('GET /api/challenge-mode error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromCookie();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { questionId, selectedAnswer } = await req.json();

    const q = CHALLENGE_QUESTIONS.find((cq) => cq.id === questionId);
    if (!q) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    const correct = selectedAnswer === q.correctAnswer;

    return NextResponse.json({
      correct,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    });
  } catch (error) {
    console.error('POST /api/challenge-mode error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
