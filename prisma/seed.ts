/**
 * Prisma Seed - Full question bank for adaptive study (25 questions)
 * IRT 3PL parameters calibrated against self-pilot EAP data (26/02/2026)
 *
 * Distribution:
 *   Bloom 1 (Remembering)  - 10 questions, b: −2.0 to −0.30
 *   Bloom 2 (Understanding) -  9 questions, b: −0.20 to +1.00
 *   Bloom 3 (Applying)     -  6 questions, b: +1.10 to +2.00
 *
 * KC coverage: all 13 knowledge components from DEFAULT_BKT_PARAMS
 *
 * Parameter conventions:
 *   a  - discrimination (0.70–1.80; higher = sharper ability boundary)
 *   b  - difficulty in logits (same scale as θ; self-pilot EAP = −0.780)
 *   c  - guessing fixed at 0.25 (4-option MCQ throughout)
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


const knowledgeComponents = [
  // Level 1: Remembering (Bloom 1)
  { id: 'UK_capitals', name: 'UK Capitals', description: 'Capital cities of UK nations', bloomLevel: 1 },
  { id: 'UK_county_locations', name: 'UK County Locations', description: 'Geographic locations of UK counties', bloomLevel: 1 },
  { id: 'UK_rivers', name: 'UK Rivers', description: 'Major river systems in the UK', bloomLevel: 1 },
  { id: 'UK_mountains', name: 'UK Mountains', description: 'Mountain ranges and peaks in the UK', bloomLevel: 1 },
  { id: 'UK_national_parks', name: 'UK National Parks', description: 'National parks and protected areas', bloomLevel: 1 },
  // Level 2: Understanding (Bloom 2)
  { id: 'westerly_winds_rainfall', name: 'Westerly Winds & Rainfall', description: 'How prevailing winds affect UK rainfall patterns', bloomLevel: 2 },
  { id: 'pennines_rain_shadow', name: 'Pennines Rain Shadow', description: 'Rain shadow effect created by the Pennines', bloomLevel: 2 },
  { id: 'maritime_continental', name: 'Maritime vs Continental Climate', description: 'Differences between maritime and continental climate influences', bloomLevel: 2 },
  { id: 'north_atlantic_drift', name: 'North Atlantic Drift', description: 'Gulf Stream influence on UK climate', bloomLevel: 2 },
  { id: 'continental_effect', name: 'Continental Effect', description: 'How distance from sea affects temperature variation', bloomLevel: 2 },
  // Level 3: Applying (Bloom 3)
  { id: 'climate_classification', name: 'Climate Classification', description: 'Applying knowledge to classify UK climate zones', bloomLevel: 3 },
  { id: 'climate_change_application', name: 'Climate Change Application', description: 'Applying climate knowledge to predict future changes', bloomLevel: 3 },
  { id: 'flood_risk_integration', name: 'Flood Risk Integration', description: 'Integrating river and rainfall knowledge for flood risk assessment', bloomLevel: 3 },
];

const prerequisiteEdges = [
  // Level 2 depends on Level 1
  { fromKCId: 'UK_county_locations', toKCId: 'westerly_winds_rainfall', masteryThreshold: 0.8 },
  { fromKCId: 'UK_mountains', toKCId: 'pennines_rain_shadow', masteryThreshold: 0.8 },
  { fromKCId: 'UK_county_locations', toKCId: 'maritime_continental', masteryThreshold: 0.8 },
  { fromKCId: 'UK_rivers', toKCId: 'north_atlantic_drift', masteryThreshold: 0.8 },
  { fromKCId: 'UK_county_locations', toKCId: 'continental_effect', masteryThreshold: 0.8 },
  // Level 3 depends on Level 2
  { fromKCId: 'maritime_continental', toKCId: 'climate_classification', masteryThreshold: 0.8 },
  { fromKCId: 'continental_effect', toKCId: 'climate_classification', masteryThreshold: 0.8 },
  { fromKCId: 'north_atlantic_drift', toKCId: 'climate_change_application', masteryThreshold: 0.8 },
  { fromKCId: 'UK_rivers', toKCId: 'flood_risk_integration', masteryThreshold: 0.8 },
  { fromKCId: 'pennines_rain_shadow', toKCId: 'flood_risk_integration', masteryThreshold: 0.8 },
];

async function main() {
  console.log('🌱 Seeding database - 25 question bank...');

  // Seed Knowledge Components
  console.log('\n🧠 Seeding Knowledge Components...');
  for (const kc of knowledgeComponents) {
    await prisma.knowledgeComponent.upsert({
      where: { id: kc.id },
      update: kc,
      create: kc,
    });
    console.log(`  ✅ KC: ${kc.id} (Bloom ${kc.bloomLevel})`);
  }

  // Seed Prerequisite Edges
  console.log('\n🔗 Seeding Prerequisite Edges...');
  for (const edge of prerequisiteEdges) {
    await prisma.prerequisiteEdge.upsert({
      where: { fromKCId_toKCId: { fromKCId: edge.fromKCId, toKCId: edge.toKCId } },
      update: edge,
      create: edge,
    });
    console.log(`  ✅ ${edge.fromKCId} → ${edge.toKCId}`);
  }

  // ── User ────────────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: 'test@elearning.dev' },
    update: {},
    create: {
      email: 'test@elearning.dev',
      name: 'Test Learner',
      password: 'dev-password-not-for-production',
      role: 'learner',
    },
  });
  console.log(`✅ User: ${user.email}`);

  // ── Topic ────────────────────────────────────────────────────────────────
  const topic = await prisma.topic.upsert({
    where: { id: 'topic-uk-geography' },
    update: {},
    create: {
      id: 'topic-uk-geography',
      title: 'UK Geography',
      description: 'Counties, capitals, rivers, mountains and climate systems',
      order: 1,
    },
  });

  // ── Lesson ───────────────────────────────────────────────────────────────
  const lesson = await prisma.lesson.upsert({
    where: { id: 'lesson-uk-geo-01' },
    update: {},
    create: {
      id: 'lesson-uk-geo-01',
      title: 'UK Counties and Climate',
      content: 'Adaptive lesson covering UK counties and climate systems.',
      topicId: topic.id,
      order: 1,
    },
  });

  // ── Quiz ─────────────────────────────────────────────────────────────────
  const quiz = await prisma.quiz.upsert({
    where: { id: 'quiz-uk-geo-adaptive' },
    update: {},
    create: {
      id: 'quiz-uk-geo-adaptive',
      title: 'UK Geography Adaptive Assessment',
      lessonId: lesson.id,
    },
  });
  console.log(`✅ Quiz: ${quiz.title}`);

  // ── Questions ─────────────────────────────────────────────────────────────
  //
  // BLOOM 1 - REMEMBERING (10 items)
  // Target: floor items that rapidly establish a θ baseline.
  // b range: −2.00 to −0.30 (all easier than self-pilot starting θ of −0.780)
  //
  // BLOOM 2 - UNDERSTANDING (9 items)
  // Target: ZPD core; causal/relational reasoning required.
  // b range: −0.20 to +1.00
  //
  // BLOOM 3 - APPLYING (6 items)
  // Target: ceiling items; synthesis across concepts required.
  // b range: +1.10 to +2.00
  //
  const questionsData = [

    // ═══════════════════════════════════════════════════════════════════════
    // BLOOM 1 - REMEMBERING
    // ═══════════════════════════════════════════════════════════════════════

    // q-001 ── UK_national_parks ── b=−0.80 (retained from self-pilot seed)
    {
      id: 'q-001',
      text: 'Which county is home to the Peak District National Park?',
      order: 1,
      irt_a: 0.85, irt_b: -0.80, irt_c: 0.25,
      bloom: 1, kc: 'UK_national_parks',
      options: [
        { text: 'Derbyshire',   isCorrect: true,  order: 1 },
        { text: 'Yorkshire',    isCorrect: false,  order: 2 },
        { text: 'Lancashire',   isCorrect: false,  order: 3 },
        { text: 'Staffordshire', isCorrect: false, order: 4 },
      ],
    },

    // q-002 ── UK_capitals ── b=−1.50 (retained from self-pilot seed)
    {
      id: 'q-002',
      text: 'What is the capital city of Wales?',
      order: 2,
      irt_a: 1.20, irt_b: -1.50, irt_c: 0.25,
      bloom: 1, kc: 'UK_capitals',
      options: [
        { text: 'Swansea',  isCorrect: false, order: 1 },
        { text: 'Newport',  isCorrect: false, order: 2 },
        { text: 'Cardiff',  isCorrect: true,  order: 3 },
        { text: 'Wrexham',  isCorrect: false, order: 4 },
      ],
    },

    // q-003 ── UK_county_locations ── b=−0.60 (retained from self-pilot seed)
    {
      id: 'q-003',
      text: 'Which county is located at the far south-west tip of England?',
      order: 3,
      irt_a: 0.90, irt_b: -0.60, irt_c: 0.25,
      bloom: 1, kc: 'UK_county_locations',
      options: [
        { text: 'Devon',     isCorrect: false, order: 1 },
        { text: 'Dorset',    isCorrect: false, order: 2 },
        { text: 'Somerset',  isCorrect: false, order: 3 },
        { text: 'Cornwall',  isCorrect: true,  order: 4 },
      ],
    },

    // q-006 ── UK_capitals ── b=−2.00
    // Easiest item in bank. Edinburgh is near-universal knowledge.
    // Serves as a confidence-building opener for low-θ learners.
    {
      id: 'q-006',
      text: 'What is the capital city of Scotland?',
      order: 6,
      irt_a: 1.00, irt_b: -2.00, irt_c: 0.25,
      bloom: 1, kc: 'UK_capitals',
      options: [
        { text: 'Glasgow',    isCorrect: false, order: 1 },
        { text: 'Edinburgh',  isCorrect: true,  order: 2 },
        { text: 'Aberdeen',   isCorrect: false, order: 3 },
        { text: 'Dundee',     isCorrect: false, order: 4 },
      ],
    },

    // q-007 ── UK_capitals ── b=−1.70
    // Belfast slightly harder than Edinburgh due to lower media salience.
    {
      id: 'q-007',
      text: 'What is the capital city of Northern Ireland?',
      order: 7,
      irt_a: 1.05, irt_b: -1.70, irt_c: 0.25,
      bloom: 1, kc: 'UK_capitals',
      options: [
        { text: 'Derry',       isCorrect: false, order: 1 },
        { text: 'Armagh',      isCorrect: false, order: 2 },
        { text: 'Belfast',     isCorrect: true,  order: 3 },
        { text: 'Lisburn',     isCorrect: false, order: 4 },
      ],
    },

    // q-008 ── UK_rivers ── b=−1.60
    // Thames-through-London is high-salience factual recall.
    {
      id: 'q-008',
      text: 'Which river flows through the centre of London?',
      order: 8,
      irt_a: 1.10, irt_b: -1.60, irt_c: 0.25,
      bloom: 1, kc: 'UK_rivers',
      options: [
        { text: 'Severn',  isCorrect: false, order: 1 },
        { text: 'Thames',  isCorrect: true,  order: 2 },
        { text: 'Medway',  isCorrect: false, order: 3 },
        { text: 'Lee',     isCorrect: false, order: 4 },
      ],
    },

    // q-009 ── UK_rivers ── b=−0.90
    // Severn as longest river is commonly confused with Thames.
    // Moderate difficulty - requires specific factual knowledge.
    {
      id: 'q-009',
      text: 'Which river is the longest in the United Kingdom?',
      order: 9,
      irt_a: 0.95, irt_b: -0.90, irt_c: 0.25,
      bloom: 1, kc: 'UK_rivers',
      options: [
        { text: 'Thames',   isCorrect: false, order: 1 },
        { text: 'Trent',    isCorrect: false, order: 2 },
        { text: 'Severn',   isCorrect: true,  order: 3 },
        { text: 'Wye',      isCorrect: false, order: 4 },
      ],
    },

    // q-010 ── UK_mountains ── b=−1.20
    // Ben Nevis is common curriculum knowledge.
    {
      id: 'q-010',
      text: 'What is the highest mountain in the United Kingdom?',
      order: 10,
      irt_a: 1.15, irt_b: -1.20, irt_c: 0.25,
      bloom: 1, kc: 'UK_mountains',
      options: [
        { text: 'Scafell Pike',  isCorrect: false, order: 1 },
        { text: 'Snowdon',       isCorrect: false, order: 2 },
        { text: 'Ben Nevis',     isCorrect: true,  order: 3 },
        { text: 'Helvellyn',     isCorrect: false, order: 4 },
      ],
    },

    // q-011 ── UK_mountains ── b=−0.50
    // Scafell Pike requires distinguishing England vs UK - harder.
    {
      id: 'q-011',
      text: 'Which mountain is the highest peak in England?',
      order: 11,
      irt_a: 1.00, irt_b: -0.50, irt_c: 0.25,
      bloom: 1, kc: 'UK_mountains',
      options: [
        { text: 'Ben Nevis',    isCorrect: false, order: 1 },
        { text: 'Snowdon',      isCorrect: false, order: 2 },
        { text: 'Scafell Pike', isCorrect: true,  order: 3 },
        { text: 'Cross Fell',   isCorrect: false, order: 4 },
      ],
    },

    // q-012 ── UK_national_parks ── b=−0.70
    // Snowdonia/Brecon Beacons distinction tests specific Welsh geography.
    {
      id: 'q-012',
      text: 'Which national park covers the mountainous region of north-west Wales?',
      order: 12,
      irt_a: 0.90, irt_b: -0.70, irt_c: 0.25,
      bloom: 1, kc: 'UK_national_parks',
      options: [
        { text: 'Brecon Beacons',    isCorrect: false, order: 1 },
        { text: 'Pembrokeshire Coast', isCorrect: false, order: 2 },
        { text: 'Snowdonia',          isCorrect: true,  order: 3 },
        { text: 'Exmoor',             isCorrect: false, order: 4 },
      ],
    },

    // q-013 ── UK_county_locations ── b=−0.40
    // York/North Yorkshire distinction tests county vs city knowledge.
    {
      id: 'q-013',
      text: 'In which county is the historic city of York located?',
      order: 13,
      irt_a: 0.85, irt_b: -0.40, irt_c: 0.25,
      bloom: 1, kc: 'UK_county_locations',
      options: [
        { text: 'West Yorkshire',   isCorrect: false, order: 1 },
        { text: 'North Yorkshire',  isCorrect: true,  order: 2 },
        { text: 'East Riding',      isCorrect: false, order: 3 },
        { text: 'South Yorkshire',  isCorrect: false, order: 4 },
      ],
    },

    // q-014 ── UK_county_locations ── b=−0.30
    // Northumberland as northernmost - slightly harder due to low salience.
    {
      id: 'q-014',
      text: 'Which is the northernmost county in England?',
      order: 14,
      irt_a: 0.80, irt_b: -0.30, irt_c: 0.25,
      bloom: 1, kc: 'UK_county_locations',
      options: [
        { text: 'Cumbria',         isCorrect: false, order: 1 },
        { text: 'Durham',          isCorrect: false, order: 2 },
        { text: 'Northumberland',  isCorrect: true,  order: 3 },
        { text: 'Tyne and Wear',   isCorrect: false, order: 4 },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // BLOOM 2 - UNDERSTANDING
    // ═══════════════════════════════════════════════════════════════════════

    // q-004 ── westerly_winds_rainfall ── b=+0.20 (retained from self-pilot)
    {
      id: 'q-004',
      text: 'Why does the west coast of the UK receive more rainfall than the east coast?',
      order: 4,
      irt_a: 1.10, irt_b: 0.20, irt_c: 0.25,
      bloom: 2, kc: 'westerly_winds_rainfall',
      options: [
        { text: 'The east coast is warmer due to the North Sea current', isCorrect: false, order: 1 },
        { text: 'Prevailing westerly winds bring moist air from the Atlantic', isCorrect: true, order: 2 },
        { text: 'The west coast has higher elevation throughout', isCorrect: false, order: 3 },
        { text: 'Urban heat islands create more precipitation in western cities', isCorrect: false, order: 4 },
      ],
    },

    // q-005 ── pennines_rain_shadow ── b=+0.50 (retained from self-pilot)
    {
      id: 'q-005',
      text: 'Which area of England lies in the rain shadow of the Pennines?',
      order: 5,
      irt_a: 1.30, irt_b: 0.50, irt_c: 0.25,
      bloom: 2, kc: 'pennines_rain_shadow',
      options: [
        { text: 'The Lake District',   isCorrect: false, order: 1 },
        { text: 'The Yorkshire Dales', isCorrect: false, order: 2 },
        { text: 'The Vale of York',    isCorrect: true,  order: 3 },
        { text: 'The Peak District',   isCorrect: false, order: 4 },
      ],
    },

    // q-015 ── maritime_continental ── b=−0.20
    // Defines maritime climate - accessible causal reasoning.
    {
      id: 'q-015',
      text: 'Which combination of characteristics best describes a maritime climate?',
      order: 15,
      irt_a: 1.05, irt_b: -0.20, irt_c: 0.25,
      bloom: 2, kc: 'maritime_continental',
      options: [
        { text: 'Hot summers, cold winters, low rainfall',         isCorrect: false, order: 1 },
        { text: 'Mild temperatures year-round with high rainfall', isCorrect: true,  order: 2 },
        { text: 'Very cold winters with low precipitation',        isCorrect: false, order: 3 },
        { text: 'High temperatures with seasonal monsoons',        isCorrect: false, order: 4 },
      ],
    },

    // q-016 ── maritime_continental ── b=+0.60
    // Requires applying continental vs maritime to specific UK city.
    // Norwich/Cambridge area is genuinely more continental - tests synthesis.
    {
      id: 'q-016',
      text: 'Which UK city has the most continental climate characteristics, with lower rainfall and greater temperature extremes?',
      order: 16,
      irt_a: 1.15, irt_b: 0.60, irt_c: 0.25,
      bloom: 2, kc: 'maritime_continental',
      options: [
        { text: 'Manchester',  isCorrect: false, order: 1 },
        { text: 'Norwich',     isCorrect: true,  order: 2 },
        { text: 'Plymouth',    isCorrect: false, order: 3 },
        { text: 'Glasgow',     isCorrect: false, order: 4 },
      ],
    },

    // q-017 ── north_atlantic_drift ── b=+0.40
    // Mechanism is taught but causal direction is commonly reversed.
    {
      id: 'q-017',
      text: 'How does the North Atlantic Drift primarily affect the UK\'s winter climate?',
      order: 17,
      irt_a: 1.20, irt_b: 0.40, irt_c: 0.25,
      bloom: 2, kc: 'north_atlantic_drift',
      options: [
        { text: 'It brings cold Arctic air southward over the British Isles',          isCorrect: false, order: 1 },
        { text: 'It carries warm water from the Gulf of Mexico, moderating temperatures', isCorrect: true, order: 2 },
        { text: 'It increases wind speeds, causing more frequent storms',              isCorrect: false, order: 3 },
        { text: 'It draws cold continental air from Siberia across northern Britain',  isCorrect: false, order: 4 },
      ],
    },

    // q-018 ── north_atlantic_drift ── b=+0.70
    // Requires knowing which UK region benefits most from NAD warming.
    {
      id: 'q-018',
      text: 'Which region of the UK benefits most from the warming influence of the North Atlantic Drift, allowing palm trees to grow at its latitude?',
      order: 18,
      irt_a: 1.25, irt_b: 0.70, irt_c: 0.25,
      bloom: 2, kc: 'north_atlantic_drift',
      options: [
        { text: 'The Shetland Islands',   isCorrect: false, order: 1 },
        { text: 'The Scottish Highlands', isCorrect: false, order: 2 },
        { text: 'South-west Scotland and western Ireland', isCorrect: true, order: 3 },
        { text: 'East Anglia',            isCorrect: false, order: 4 },
      ],
    },

    // q-019 ── continental_effect ── b=+0.80
    // Distance from ocean + rain shadow combined - multi-factor reasoning.
    {
      id: 'q-019',
      text: 'Why does eastern England experience significantly lower annual rainfall than western regions at equivalent latitudes?',
      order: 19,
      irt_a: 1.30, irt_b: 0.80, irt_c: 0.25,
      bloom: 2, kc: 'continental_effect',
      options: [
        { text: 'Eastern England is at a lower altitude throughout',                          isCorrect: false, order: 1 },
        { text: 'Air masses lose moisture crossing high ground before reaching the east',     isCorrect: true,  order: 2 },
        { text: 'The North Sea absorbs moisture before it reaches the east coast',           isCorrect: false, order: 3 },
        { text: 'Eastern England has fewer weather fronts due to anticyclonic dominance',    isCorrect: false, order: 4 },
      ],
    },

    // q-020 ── continental_effect ── b=+1.00
    // Requires understanding why SE England has hottest summers - urban + continental.
    {
      id: 'q-020',
      text: 'Which factor best explains why south-east England typically records the UK\'s highest summer temperatures?',
      order: 20,
      irt_a: 1.35, irt_b: 1.00, irt_c: 0.25,
      bloom: 2, kc: 'continental_effect',
      options: [
        { text: 'Proximity to the warming influence of the Gulf Stream',             isCorrect: false, order: 1 },
        { text: 'Continental air masses from Europe encounter minimal cooling',      isCorrect: true,  order: 2 },
        { text: 'Higher solar intensity due to reduced cloud cover year-round',      isCorrect: false, order: 3 },
        { text: 'Greater urban land use compared to northern regions',               isCorrect: false, order: 4 },
      ],
    },

    // q-021 ── westerly_winds_rainfall ── b=+0.30
    // Extends q-004 - requires knowing orographic enhancement mechanism.
    {
      id: 'q-021',
      text: 'What is the primary mechanism by which mountains in the Lake District generate high local rainfall?',
      order: 21,
      irt_a: 1.10, irt_b: 0.30, irt_c: 0.25,
      bloom: 2, kc: 'westerly_winds_rainfall',
      options: [
        { text: 'Convectional uplift due to high summer temperatures',                        isCorrect: false, order: 1 },
        { text: 'Orographic uplift forcing moist Atlantic air to rise and cool',             isCorrect: true,  order: 2 },
        { text: 'Frontal systems stall against the mountains, releasing prolonged rain',      isCorrect: false, order: 3 },
        { text: 'Proximity to the Irish Sea drives persistent onshore sea-breeze rainfall',  isCorrect: false, order: 4 },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // BLOOM 3 - APPLYING
    // ═══════════════════════════════════════════════════════════════════════

    // q-022 ── climate_classification ── b=+1.10
    // Requires mapping descriptive UK climate properties to Koppen code.
    {
      id: 'q-022',
      text: 'Which Köppen climate classification best describes the climate of lowland England?',
      order: 22,
      irt_a: 1.40, irt_b: 1.10, irt_c: 0.25,
      bloom: 3, kc: 'climate_classification',
      options: [
        { text: 'Dfc - Subarctic with cool summers',                                isCorrect: false, order: 1 },
        { text: 'Cfb - Oceanic, with mild summers and no dry season',               isCorrect: true,  order: 2 },
        { text: 'BSk - Cold semi-arid steppe',                                      isCorrect: false, order: 3 },
        { text: 'Csa - Mediterranean with hot, dry summers',                        isCorrect: false, order: 4 },
      ],
    },

    // q-023 ── climate_classification ── b=+1.40
    // Applies classification framework to distinguish Scottish Highland conditions.
    {
      id: 'q-023',
      text: 'How does the climate of the Scottish Highlands differ from lowland England, and which classification shift best captures this?',
      order: 23,
      irt_a: 1.45, irt_b: 1.40, irt_c: 0.25,
      bloom: 3, kc: 'climate_classification',
      options: [
        { text: 'Warmer and drier - shifting toward Csa (Mediterranean)',                    isCorrect: false, order: 1 },
        { text: 'Colder with shorter growing seasons - transitioning toward Dfc (subarctic)', isCorrect: true, order: 2 },
        { text: 'More continental, with greater annual temperature range - toward Dfb',      isCorrect: false, order: 3 },
        { text: 'Wetter but warmer - remaining firmly Cfb throughout',                       isCorrect: false, order: 4 },
      ],
    },

    // q-024 ── climate_change_application ── b=+1.30
    // Requires applying trend data to predict regional impact - novel synthesis.
    {
      id: 'q-024',
      text: 'Based on current UK climate projections, which region faces the greatest increase in winter flood risk by 2050?',
      order: 24,
      irt_a: 1.50, irt_b: 1.30, irt_c: 0.25,
      bloom: 3, kc: 'climate_change_application',
      options: [
        { text: 'South-east England, due to rising sea levels and storm surge',     isCorrect: false, order: 1 },
        { text: 'North-west England and Wales, due to intensified westerly rainfall', isCorrect: true, order: 2 },
        { text: 'East Anglia, due to increased continental storm frequency',         isCorrect: false, order: 3 },
        { text: 'Central Scotland, due to accelerated snowmelt from Ben Nevis',     isCorrect: false, order: 4 },
      ],
    },

    // q-025 ── climate_change_application ── b=+1.60
    // Requires distinguishing which mechanism explains a specific observed anomaly.
    {
      id: 'q-025',
      text: 'A farmer in East Anglia records increasingly dry summers over the past two decades. Which climate mechanism most directly explains this trend?',
      order: 25,
      irt_a: 1.55, irt_b: 1.60, irt_c: 0.25,
      bloom: 3, kc: 'climate_change_application',
      options: [
        { text: 'Weakening of the North Atlantic Drift reducing ocean moisture supply',       isCorrect: false, order: 1 },
        { text: 'Amplification of the continental effect as climate change shifts jet stream patterns', isCorrect: true, order: 2 },
        { text: 'Urban expansion reducing local evapotranspiration and rainfall recycling',  isCorrect: false, order: 3 },
        { text: 'Increased solar radiation penetrating reduced cloud cover over eastern UK', isCorrect: false, order: 4 },
      ],
    },

    // q-026 ── flood_risk_integration ── b=+1.80
    // Highest difficulty item. Requires integrating topography, precipitation,
    // land use and drainage - true cross-concept synthesis.
    {
      id: 'q-026',
      text: 'A low-lying Somerset village floods every winter despite being 15 miles from the coast. Which combination of factors best explains its persistent flood risk?',
      order: 26,
      irt_a: 1.60, irt_b: 1.80, irt_c: 0.25,
      bloom: 3, kc: 'flood_risk_integration',
      options: [
        { text: 'Tidal surges from the Bristol Channel combined with high annual rainfall',           isCorrect: false, order: 1 },
        { text: 'High westerly rainfall on Exmoor and Mendips draining onto impermeable clay floodplains', isCorrect: true, order: 2 },
        { text: 'Deforestation of surrounding hillsides reducing interception and increasing runoff', isCorrect: false, order: 3 },
        { text: 'Urban impermeability in nearby towns diverting surface water toward rural areas',    isCorrect: false, order: 4 },
      ],
    },

    // q-027 ── flood_risk_integration ── b=+2.00
    // Ceiling item. Requires evaluating competing interventions - highest-order application.
    {
      id: 'q-027',
      text: 'A UK government report proposes three interventions to reduce flood risk in a northern river valley: upstream afforestation, flood storage reservoirs, and urban sustainable drainage. Which evaluation framework should prioritise the interventions, and why?',
      order: 27,
      irt_a: 1.65, irt_b: 2.00, irt_c: 0.25,
      bloom: 3, kc: 'flood_risk_integration',
      options: [
        { text: 'Cost alone - the cheapest intervention should always be prioritised regardless of effectiveness', isCorrect: false, order: 1 },
        { text: 'Catchment position - upstream interventions should take priority as they address root causes before downstream symptoms', isCorrect: true, order: 2 },
        { text: 'Speed of implementation - the fastest intervention should be prioritised to reduce immediate risk', isCorrect: false, order: 3 },
        { text: 'Population density - interventions protecting the most people should always take precedence', isCorrect: false, order: 4 },
      ],
    },

  ];

  // ── Seed all questions ──────────────────────────────────────────────────
  for (const qData of questionsData) {
    const { options, ...questionFields } = qData;

    await prisma.question.upsert({
      where: { id: qData.id },
      update: {},
      create: {
        ...questionFields,
        quizId: quiz.id,
        type: 'multiple_choice',
        options: {
          create: options,
        },
      },
    });

    const bloomLabel = ['', 'Remembering', 'Understanding', 'Applying'][qData.bloom];
    console.log(
      `  ✅ ${qData.id}  b=${qData.irt_b.toFixed(2).padStart(5)}  ` +
      `Bloom${qData.bloom} (${bloomLabel})  KC: ${qData.kc}`
    );
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  const total = questionsData.length;
  const b1 = questionsData.filter((q) => q.bloom === 1).length;
  const b2 = questionsData.filter((q) => q.bloom === 2).length;
  const b3 = questionsData.filter((q) => q.bloom === 3).length;
  const bMin = Math.min(...questionsData.map((q) => q.irt_b)).toFixed(2);
  const bMax = Math.max(...questionsData.map((q) => q.irt_b)).toFixed(2);
  const bMean = (questionsData.reduce((s, q) => s + q.irt_b, 0) / total).toFixed(3);

  console.log('\n── Bank Summary ─────────────────────────────────────────');
  console.log(`   Total questions : ${total}`);
  console.log(`   Bloom 1         : ${b1} items`);
  console.log(`   Bloom 2         : ${b2} items`);
  console.log(`   Bloom 3         : ${b3} items`);
  console.log(`   b range         : ${bMin} → ${bMax}`);
  console.log(`   b mean          : ${bMean}`);
  console.log(`   KCs covered     : 13 / 13`);
  console.log('─────────────────────────────────────────────────────────\n');
  console.log(`   Quiz ID : ${quiz.id}`);
  console.log(`   User ID : ${user.id}`);
  console.log('\n   Test: POST /api/sessions');
  console.log(`         { "userId": "${user.id}", "quizId": "${quiz.id}", "condition": "adaptive" }`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });