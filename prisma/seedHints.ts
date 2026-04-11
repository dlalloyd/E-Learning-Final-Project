/**
 * Prisma Seed - Hint bank for progressive scaffolding
 *
 * 81 hints total: 3 hints per question across all 27 questions.
 *
 * Hint levels follow a scaffolding progression:
 *   Level 1 (Conceptual)      - Points to the relevant concept without revealing the answer
 *   Level 2 (Procedural)      - Provides the approach or reasoning strategy
 *   Level 3 (Worked Example)  - Shows a similar solved problem or near-direct guidance
 *
 * Bloom-level pedagogy:
 *   Bloom 1 (Remembering)     - Hints jog memory via associations and spatial cues
 *   Bloom 2 (Understanding)   - Hints build causal reasoning step by step
 *   Bloom 3 (Applying)        - Hints demonstrate the analytical framework on analogous cases
 *
 * Run: npx tsx prisma/seedHints.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface HintData {
  questionId: string;
  hintLevel: number;
  orderIndex: number;
  hintText: string;
}

const hintsData: HintData[] = [
  // ──────────────────────────────────────────────────────────────
  // BLOOM 1 - REMEMBERING
  // ──────────────────────────────────────────────────────────────

  // q-001: "Which county is home to the Peak District National Park?" (Derbyshire)
  {
    questionId: 'q-001',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about the counties in the central-north of England - the Peak District sits at the southern end of the Pennines.',
  },
  {
    questionId: 'q-001',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'The county shares its name with a historic city famous for its cathedral and a curved Georgian terrace called The Crescent.',
  },
  {
    questionId: 'q-001',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Just as the Lake District sits within Cumbria, the Peak District sits primarily within a county whose name ends in "-shire" and starts with "Derby".',
  },

  // q-002: "What is the capital city of Wales?" (Cardiff)
  {
    questionId: 'q-002',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Each UK nation has a capital city. Think about where the Welsh Parliament (Senedd) meets.',
  },
  {
    questionId: 'q-002',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'This city is located on the south coast of Wales and is the country\'s largest city by population.',
  },
  {
    questionId: 'q-002',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'London is to England as this city - home to the Principality Stadium and Cardiff Bay - is to Wales.',
  },

  // q-003: "Which county is located at the far south-west tip of England?" (Cornwall)
  {
    questionId: 'q-003',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Picture the map of England - which county forms the narrow peninsula that juts out into the Atlantic?',
  },
  {
    questionId: 'q-003',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'This county is famous for its rugged coastline, tin mining heritage, and Land\'s End - the most westerly point of mainland England.',
  },
  {
    questionId: 'q-003',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Devon sits just to the east of this county. Its name starts with "Corn-" and it contains towns like St Ives, Truro, and Penzance.',
  },

  // q-006: "What is the capital city of Scotland?" (Edinburgh)
  {
    questionId: 'q-006',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about which Scottish city hosts the Scottish Parliament and is famous for its annual arts festival.',
  },
  {
    questionId: 'q-006',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'This city sits on the east coast of Scotland and is known for its castle perched on a volcanic rock.',
  },
  {
    questionId: 'q-006',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Glasgow is Scotland\'s largest city, but the capital is the other major Scottish city - the one with the Royal Mile and Arthur\'s Seat.',
  },

  // q-007: "What is the capital city of Northern Ireland?" (Belfast)
  {
    questionId: 'q-007',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Consider which city in Northern Ireland serves as the seat of the devolved government at Stormont.',
  },
  {
    questionId: 'q-007',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'This city is Northern Ireland\'s largest and sits at the mouth of the River Lagan on the east coast.',
  },
  {
    questionId: 'q-007',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'This city - famous for the shipyard where the Titanic was built - shares its name with the lough on which it sits. It starts with "Bel-".',
  },

  // q-008: "Which river flows through the centre of London?" (Thames)
  {
    questionId: 'q-008',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about the famous river crossings in London - Tower Bridge, Westminster Bridge, and the Millennium Bridge all span this river.',
  },
  {
    questionId: 'q-008',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'This river rises in the Cotswolds and flows eastward through Oxford and Reading before reaching the capital.',
  },
  {
    questionId: 'q-008',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'The Houses of Parliament sit on the north bank of this river, and the London Eye on its south bank. It shares its name with a famous barrier that prevents flooding.',
  },

  // q-009: "Which river is the longest in the United Kingdom?" (Severn)
  {
    questionId: 'q-009',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'The longest river in the UK is not in England\'s south-east - it rises in Wales and flows through the English Midlands.',
  },
  {
    questionId: 'q-009',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'This river is 220 miles long, rises on Plynlimon in mid-Wales, and has a famous tidal bore. It flows into the Bristol Channel.',
  },
  {
    questionId: 'q-009',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'The Thames (215 miles) is the second-longest UK river. The longest one flows through Shrewsbury, Worcester, and Gloucester, and is spanned by two famous road bridges near its estuary.',
  },

  // q-010: "What is the highest mountain in the United Kingdom?" (Ben Nevis)
  {
    questionId: 'q-010',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'The UK\'s highest peaks are in Scotland. Think about which mountain near Fort William attracts thousands of hikers each year.',
  },
  {
    questionId: 'q-010',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'At 1,345 metres, this mountain is in the Grampian range of the Scottish Highlands. Its name begins with "Ben", the Scots Gaelic word for peak.',
  },
  {
    questionId: 'q-010',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Snowdon (1,085m) is the highest in Wales, Scafell Pike (978m) the highest in England. The UK\'s tallest summit is Ben _____ - the second word means "malicious" or "venomous" in Gaelic.',
  },

  // q-011: "Which mountain is the highest peak in England?" (Scafell Pike)
  {
    questionId: 'q-011',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'England\'s highest mountain is located in the Lake District, in the north-west of the country.',
  },
  {
    questionId: 'q-011',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'This mountain stands at 978 metres in Cumbria and is one of the "Three Peaks" challenge summits alongside Ben Nevis and Snowdon.',
  },
  {
    questionId: 'q-011',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Helvellyn (950m) is the third-highest peak in England. The highest is a "Pike" - a two-word name starting with "Sca-" - found near Wastwater in the western Lake District.',
  },

  // q-012: "Which national park covers the mountainous region of north-west Wales?" (Snowdonia)
  {
    questionId: 'q-012',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about which Welsh national park contains the highest mountain in Wales.',
  },
  {
    questionId: 'q-012',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'This park in Gwynedd contains peaks over 1,000 metres, glacial lakes, and the mountain railway that climbs Wales\'s tallest summit.',
  },
  {
    questionId: 'q-012',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'The Brecon Beacons cover south Wales, while this park - named after the mountain Snowdon (Yr Wyddfa) - covers the mountainous north-west.',
  },

  // q-013: "In which county is the historic city of York located?" (North Yorkshire)
  {
    questionId: 'q-013',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'The city of York is in northern England. Consider which county shares a name with this historic city.',
  },
  {
    questionId: 'q-013',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'The historic county of Yorkshire was divided into several parts. York sits in the largest of these divisions, which covers the Dales and the North York Moors.',
  },
  {
    questionId: 'q-013',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'There is West Yorkshire (Leeds/Bradford), South Yorkshire (Sheffield), East Riding, and one more - the largest by area, containing York, Harrogate, and Scarborough.',
  },

  // q-014: "Which is the northernmost county in England?" (Northumberland)
  {
    questionId: 'q-014',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about which English county shares a border with Scotland.',
  },
  {
    questionId: 'q-014',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'This county is home to Hadrian\'s Wall and the Cheviot Hills, which form the natural border with Scotland.',
  },
  {
    questionId: 'q-014',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Cumbria borders Scotland in the north-west, but the northernmost county overall is in the north-east - its name literally means "the land north of the Humber" and starts with "North-".',
  },

  // ──────────────────────────────────────────────────────────────
  // BLOOM 2 - UNDERSTANDING
  // ──────────────────────────────────────────────────────────────

  // q-004: "Why does the west coast of the UK receive more rainfall than the east coast?" (Prevailing westerly winds bring moist air from the Atlantic)
  {
    questionId: 'q-004',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about which direction prevailing winds come from in the UK and what large body of water lies to the west.',
  },
  {
    questionId: 'q-004',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'Winds crossing the Atlantic Ocean absorb moisture through evaporation. When these air masses reach the UK\'s western coast and are forced upward by highlands, the moisture condenses and falls as rain.',
  },
  {
    questionId: 'q-004',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'The same mechanism explains why Bergen, Norway receives 2,250mm of rain annually - moist westerly air from the Atlantic hits coastal mountains. In the UK, the prevailing south-westerly winds carry moisture-laden air that meets western uplands first.',
  },

  // q-005: "Which area of England lies in the rain shadow of the Pennines?" (The Vale of York)
  {
    questionId: 'q-005',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'A rain shadow forms on the leeward (sheltered) side of a mountain range. Think about what lies to the east of the Pennines.',
  },
  {
    questionId: 'q-005',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'As moist westerly air rises over the Pennines, it loses moisture on the western slopes. By the time it descends on the eastern side, it is much drier. Which low-lying valley sits directly east of the central Pennines?',
  },
  {
    questionId: 'q-005',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'The rain shadow principle: Death Valley is dry because the Sierra Nevada strips moisture from Pacific air. Similarly, the broad lowland valley east of the Pennines - stretching from the city of York northward - receives notably less rainfall than the western slopes.',
  },

  // q-015: "Which combination of characteristics best describes a maritime climate?" (Mild temperatures year-round with high rainfall)
  {
    questionId: 'q-015',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Consider what "maritime" means - it relates to the sea. How does proximity to the ocean affect temperature extremes and moisture?',
  },
  {
    questionId: 'q-015',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'Water heats and cools more slowly than land. A maritime climate is therefore moderated by the ocean - think about what this means for seasonal temperature range and moisture availability.',
  },
  {
    questionId: 'q-015',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Compare Dublin (maritime) with Moscow (continental): Dublin has cool summers (~16°C) and mild winters (~5°C) with year-round rainfall, while Moscow swings from +19°C summers to -10°C winters. Maritime climates have small temperature ranges and abundant precipitation.',
  },

  // q-016: "Which UK city has the most continental climate characteristics?" (Norwich)
  {
    questionId: 'q-016',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Continental climates have larger temperature extremes and less rainfall. Think about which part of the UK is furthest from the Atlantic\'s moderating influence.',
  },
  {
    questionId: 'q-016',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'Eastern England receives continental air masses from mainland Europe and is sheltered from Atlantic moisture by the landmass of Britain itself. Which major city in East Anglia would experience this most strongly?',
  },
  {
    questionId: 'q-016',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Compare annual temperature ranges: Glasgow (west coast) varies about 10°C between summer and winter means, while a city in Norfolk - the capital of East Anglia - varies about 14°C and receives only ~650mm of rain. That eastern city starts with "N".',
  },

  // q-017: "How does the North Atlantic Drift primarily affect the UK's winter climate?" (It carries warm water from the Gulf of Mexico, moderating temperatures)
  {
    questionId: 'q-017',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about where the North Atlantic Drift (an extension of the Gulf Stream) originates and what it transports across the ocean.',
  },
  {
    questionId: 'q-017',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'The North Atlantic Drift carries warm tropical water northward from the Caribbean. When prevailing winds blow over this warm water, they pick up heat before reaching the UK. Consider how this would affect winter temperatures specifically.',
  },
  {
    questionId: 'q-017',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Labrador in Canada sits at the same latitude as the UK (~50-55°N) but averages -15°C in January compared to the UK\'s +5°C. The difference is the North Atlantic Drift: it warms the ocean surface near the UK, so westerly winds arriving in winter carry that heat onto land.',
  },

  // q-018: "Which region of the UK benefits most from the warming influence of the North Atlantic Drift?" (South-west Scotland and western Ireland)
  {
    questionId: 'q-018',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about which parts of the UK and Ireland are positioned closest to the path of the warm ocean current as it flows north-eastward.',
  },
  {
    questionId: 'q-018',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'The North Atlantic Drift flows north-east past the western British Isles. The regions that benefit most are those directly exposed to these warmed ocean waters - western and north-western coastal areas at higher latitudes where the warming effect is most pronounced compared to what temperatures would otherwise be.',
  },
  {
    questionId: 'q-018',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Gardens in south-west Scotland can grow subtropical plants like palm trees despite being at 55°N - the same latitude as Moscow. This is because the North Atlantic Drift warms the sea surface along the western coast, giving these exposed Atlantic-facing regions the greatest temperature boost relative to their latitude.',
  },

  // q-019: "Why does eastern England experience significantly lower annual rainfall?" (Air masses lose moisture crossing high ground before reaching the east)
  {
    questionId: 'q-019',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Consider the journey of moist air from the Atlantic. What obstacles does it encounter before reaching eastern England?',
  },
  {
    questionId: 'q-019',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'As Atlantic air moves eastward, it is forced upward by the hills and mountains of Wales, the Pennines, and the Lake District. Orographic rainfall depletes the moisture, so by the time the air descends into eastern lowlands, it has much less water content.',
  },
  {
    questionId: 'q-019',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Seathwaite in Cumbria (western uplands) receives ~3,400mm of rain per year, while Cambridge (eastern lowlands) receives only ~550mm. The mechanism is the same as the Atacama Desert behind the Andes - air masses lose their moisture crossing elevated terrain before reaching the leeward side.',
  },

  // q-020: "Which factor best explains why south-east England typically records the UK's highest summer temperatures?" (Continental air masses from Europe encounter minimal cooling)
  {
    questionId: 'q-020',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about where south-east England is positioned relative to mainland Europe and consider what type of air masses might reach it in summer.',
  },
  {
    questionId: 'q-020',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'In summer, hot air from the European continent can travel a short distance across the narrow English Channel to reach south-east England. Unlike maritime air that crosses a wide ocean, this continental air retains most of its heat.',
  },
  {
    questionId: 'q-020',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Paris and south-east England are only ~340km apart across a narrow channel. When a continental heatwave builds over France, the hot dry air crosses the Channel with minimal marine cooling - the water crossing is simply too short to moderate the temperature significantly. This is why Kent and London regularly hit 35°C+ while western Scotland rarely exceeds 25°C.',
  },

  // q-021: "What is the primary mechanism by which mountains in the Lake District generate high local rainfall?" (Orographic uplift forcing moist Atlantic air to rise and cool)
  {
    questionId: 'q-021',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about what happens when moist air encounters a physical barrier like a mountain range. How does altitude affect air temperature and moisture capacity?',
  },
  {
    questionId: 'q-021',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'When moist air is forced upward by terrain (orographic uplift), it cools at the adiabatic lapse rate. Cooler air holds less moisture, so water vapour condenses into clouds and precipitation. The Lake District mountains directly face incoming Atlantic weather systems.',
  },
  {
    questionId: 'q-021',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'The process is identical to why the Hawaiian peak of Mount Waialeale (1,569m) is one of the wettest places on Earth: trade winds carry moist Pacific air that is forced upward by the mountain, cooling and condensing. In the Lake District, moist south-westerly Atlantic air hits peaks like Helvellyn (950m) - Seathwaite receives ~3,400mm/year through this orographic mechanism.',
  },

  // ──────────────────────────────────────────────────────────────
  // BLOOM 3 - APPLYING
  // ──────────────────────────────────────────────────────────────

  // q-022: "Which Köppen climate classification best describes the climate of lowland England?" (Cfb - Oceanic)
  {
    questionId: 'q-022',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'The Köppen system uses letters to encode temperature and precipitation patterns. Think about the "C" (temperate) group and what suffix indicates oceanic conditions with no dry season.',
  },
  {
    questionId: 'q-022',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'In Köppen classification: "C" = temperate (coldest month above -3°C), "f" = no dry season, "b" = warmest month below 22°C. Lowland England has mild winters, cool summers, and year-round rainfall - which three-letter code does this produce?',
  },
  {
    questionId: 'q-022',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Apply the same logic used to classify Paris or Amsterdam: both have temperate winters (C), no dry season (f), and warm but not hot summers under 22°C (b). London\'s climate is very similar - the classification is C + f + b, which defines the "Oceanic" climate type.',
  },

  // q-023: "How does the climate of the Scottish Highlands differ from lowland England?" (Colder with shorter growing seasons - transitioning toward Dfc (subarctic))
  {
    questionId: 'q-023',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about how altitude and latitude together affect temperature. The Scottish Highlands are both higher and further north than lowland England.',
  },
  {
    questionId: 'q-023',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'In the Köppen system, when cold-month temperatures drop further and fewer months exceed 10°C, the classification shifts from "C" (temperate) toward "D" (continental/subarctic). Consider how many warm months the Highlands experience compared to lowland England.',
  },
  {
    questionId: 'q-023',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Apply the elevation-latitude analogy: Tromsø, Norway (69°N, sea level) and the Cairngorms (57°N, ~1,000m) both have short growing seasons with only 1-3 months above 10°C. When fewer than 4 months exceed 10°C with no dry season, Köppen shifts from Cfb toward Dfc - the subarctic classification.',
  },

  // q-024: "Based on current UK climate projections, which region faces the greatest increase in winter flood risk by 2050?" (North-west England and Wales, due to intensified westerly rainfall)
  {
    questionId: 'q-024',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about which UK regions already receive the most winter rainfall and consider how climate change is projected to intensify existing precipitation patterns.',
  },
  {
    questionId: 'q-024',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'Climate models project stronger westerly winds and warmer air (holding more moisture via the Clausius-Clapeyron relation - roughly 7% more per 1°C). Regions already exposed to Atlantic frontal systems and orographic rainfall will see the greatest amplification.',
  },
  {
    questionId: 'q-024',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Apply the same reasoning used for Norwegian flood projections: western Norway faces increased flood risk because stronger Atlantic storms deliver more moisture to terrain that already forces orographic rainfall. In the UK, the equivalent regions are the mountainous areas facing the Atlantic - the Lake District, Snowdonia, and the western Pennines - which sit in north-west England and Wales.',
  },

  // q-025: "A farmer in East Anglia records increasingly dry summers..." (Amplification of the continental effect as climate change shifts jet stream patterns)
  {
    questionId: 'q-025',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about East Anglia\'s position in the UK and why it already experiences drier conditions. Consider how climate change might amplify existing geographic effects.',
  },
  {
    questionId: 'q-025',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'East Anglia is already in the rain shadow of central England and is closest to the European continent. Climate change is projected to shift the jet stream northward in summer, allowing more frequent incursions of hot, dry continental air from Europe into south-east England.',
  },
  {
    questionId: 'q-025',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Apply the principle of amplified continental influence: the Mediterranean region is drying because the subtropical high-pressure belt is expanding poleward. Similarly, as the jet stream shifts north in summer, East Anglia increasingly falls under the influence of European continental highs - amplifying the existing continental effect that already makes it the UK\'s driest region.',
  },

  // q-026: "A low-lying Somerset village floods every winter..." (High westerly rainfall on Exmoor and Mendips draining onto impermeable clay floodplains)
  {
    questionId: 'q-026',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about the physical geography of Somerset: what upland areas surround the low-lying Somerset Levels, and what happens when heavy rain falls on those uplands?',
  },
  {
    questionId: 'q-026',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'Break the flooding mechanism into a chain: (1) prevailing westerly winds bring heavy rainfall, (2) rain falls on Exmoor and the Mendip Hills, (3) water flows downhill onto the flat Somerset Levels, (4) the clay soil of the floodplain is impermeable and cannot absorb the water.',
  },
  {
    questionId: 'q-026',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Apply the same framework used for the 2014 Somerset Levels floods: Exmoor received 150% of average winter rainfall (Atlantic westerlies), which drained into the River Parrett and its tributaries. The Somerset Levels are flat, low-lying clay floodplains - impermeable clay prevents drainage, so the water has nowhere to go. The answer integrates upland rainfall source, drainage pathways, and floodplain geology.',
  },

  // q-027: "A UK government report proposes three flood risk interventions..." (Catchment position - upstream interventions should take priority)
  {
    questionId: 'q-027',
    hintLevel: 1,
    orderIndex: 0,
    hintText: 'Think about where in a river\'s catchment it is most effective to intervene - at the source of the water, or where it has already accumulated?',
  },
  {
    questionId: 'q-027',
    hintLevel: 2,
    orderIndex: 1,
    hintText: 'Flood management follows the principle of catchment-based thinking: interventions upstream (afforestation, natural flood management, soil improvement) slow water before it accumulates, reducing peak flow downstream. Downstream defences alone only protect individual locations without reducing overall flood volume.',
  },
  {
    questionId: 'q-027',
    hintLevel: 3,
    orderIndex: 2,
    hintText: 'Apply the Pickering (North Yorkshire) case study: upstream tree planting and "leaky dams" in headwater streams reduced peak flow by 15-25%, protecting the town without expensive engineered defences. The key evaluation criterion is catchment position - upstream interventions address the cause (water volume entering the system) while downstream interventions only treat the symptom (water arriving at a specific point).',
  },
];

async function main() {
  console.log('Seeding hints...');
  console.log(`Total hints to seed: ${hintsData.length}`);

  // Use a transaction with createMany for efficiency
  const result = await prisma.hint.createMany({
    data: hintsData,
    skipDuplicates: true,
  });

  console.log(`Successfully seeded ${result.count} hints.`);
}

main()
  .catch((e) => {
    console.error('Error seeding hints:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
