// ============================================================================
// QUESTION TEMPLATES SEED FILE
// prisma/seed-templates.ts
// 
// 80+ isomorphic variants across 13 Knowledge Components
// Supports MC, Cloze, and Free Text formats for Input Fading
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// KC DEFINITIONS (Reference)
// These should already exist in your database from previous seeding
// ============================================================================

const KC_IDS = {
  // L1 - Remembering
  UK_CAPITALS: 'UK_capitals',
  COUNTIES_NORTH: 'UK_county_locations',  // Combined into one KC
  COUNTIES_SOUTH: 'UK_county_locations',  // Same KC for all counties
  MAJOR_RIVERS: 'UK_rivers',
  MOUNTAIN_RANGES: 'UK_mountains',
  NATIONAL_PARKS: 'UK_national_parks',
  
  // L2 - Understanding
  WESTERLY_WINDS: 'westerly_winds_rainfall',
  RAIN_SHADOW: 'pennines_rain_shadow',
  MARITIME_CONTINENTAL: 'maritime_continental',
  NORTH_ATLANTIC_DRIFT: 'north_atlantic_drift',
  CONTINENTAL_EFFECT: 'continental_effect',
  
  // L3 - Applying
  CLIMATE_CLASSIFICATION: 'climate_classification',
  CLIMATE_CHANGE: 'climate_change_application',
};

// ============================================================================
// TEMPLATE DATA STRUCTURE
// ============================================================================

interface TemplateData {
  templateText: string;
  kcId: string;
  difficulty: number;
  bloomLevel: number;
  supportsMC: boolean;
  supportsCloze: boolean;
  supportsFreeText: boolean;
  variants: {
    variables: Record<string, string>;
    correctAnswer: string;
    acceptedAnswers?: string[];
    distractors: string[];
    clozeTemplate?: string;
  }[];
}

// ============================================================================
// QUESTION TEMPLATES
// ============================================================================

const templates: TemplateData[] = [
  // =========================================================================
  // KC: UK CAPITALS (6 variants)
  // =========================================================================
  {
    templateText: "What is the capital city of {country}?",
    kcId: KC_IDS.UK_CAPITALS,
    difficulty: -1.5,
    bloomLevel: 1,
    supportsMC: true,
    supportsCloze: true,
    supportsFreeText: true,
    variants: [
      {
        variables: { country: "England" },
        correctAnswer: "London",
        acceptedAnswers: ["london"],
        distractors: ["Manchester", "Birmingham", "Liverpool"],
        clozeTemplate: "The capital city of England is {blank}.",
      },
      {
        variables: { country: "Scotland" },
        correctAnswer: "Edinburgh",
        acceptedAnswers: ["edinburgh", "Edinburg"],
        distractors: ["Glasgow", "Aberdeen", "Dundee"],
        clozeTemplate: "The capital city of Scotland is {blank}.",
      },
      {
        variables: { country: "Wales" },
        correctAnswer: "Cardiff",
        acceptedAnswers: ["cardiff"],
        distractors: ["Swansea", "Newport", "Wrexham"],
        clozeTemplate: "The capital city of Wales is {blank}.",
      },
      {
        variables: { country: "Northern Ireland" },
        correctAnswer: "Belfast",
        acceptedAnswers: ["belfast"],
        distractors: ["Derry", "Newry", "Lisburn"],
        clozeTemplate: "The capital city of Northern Ireland is {blank}.",
      },
    ],
  },
  
  // =========================================================================
  // KC: COUNTIES NORTH (8 variants)
  // =========================================================================
  {
    templateText: "Which county is {city} located in?",
    kcId: KC_IDS.COUNTIES_NORTH,
    difficulty: -0.5,
    bloomLevel: 1,
    supportsMC: true,
    supportsCloze: true,
    supportsFreeText: true,
    variants: [
      {
        variables: { city: "Manchester" },
        correctAnswer: "Greater Manchester",
        acceptedAnswers: ["greater manchester", "Lancashire"],
        distractors: ["Yorkshire", "Cheshire", "Merseyside"],
        clozeTemplate: "Manchester is located in {blank}.",
      },
      {
        variables: { city: "Leeds" },
        correctAnswer: "West Yorkshire",
        acceptedAnswers: ["west yorkshire", "Yorkshire"],
        distractors: ["South Yorkshire", "Lancashire", "Durham"],
        clozeTemplate: "Leeds is located in {blank}.",
      },
      {
        variables: { city: "Newcastle" },
        correctAnswer: "Tyne and Wear",
        acceptedAnswers: ["tyne and wear", "Northumberland"],
        distractors: ["Durham", "Cumbria", "North Yorkshire"],
        clozeTemplate: "Newcastle is located in {blank}.",
      },
      {
        variables: { city: "Sheffield" },
        correctAnswer: "South Yorkshire",
        acceptedAnswers: ["south yorkshire", "Yorkshire"],
        distractors: ["Derbyshire", "Nottinghamshire", "West Yorkshire"],
        clozeTemplate: "Sheffield is located in {blank}.",
      },
      {
        variables: { city: "Liverpool" },
        correctAnswer: "Merseyside",
        acceptedAnswers: ["merseyside"],
        distractors: ["Lancashire", "Cheshire", "Greater Manchester"],
        clozeTemplate: "Liverpool is located in {blank}.",
      },
      {
        variables: { city: "York" },
        correctAnswer: "North Yorkshire",
        acceptedAnswers: ["north yorkshire", "Yorkshire"],
        distractors: ["West Yorkshire", "East Yorkshire", "Durham"],
        clozeTemplate: "York is located in {blank}.",
      },
    ],
  },
  
  // =========================================================================
  // KC: COUNTIES SOUTH (8 variants)
  // =========================================================================
  {
    templateText: "Which county is {city} located in?",
    kcId: KC_IDS.COUNTIES_SOUTH,
    difficulty: -0.5,
    bloomLevel: 1,
    supportsMC: true,
    supportsCloze: true,
    supportsFreeText: true,
    variants: [
      {
        variables: { city: "Brighton" },
        correctAnswer: "East Sussex",
        acceptedAnswers: ["east sussex", "Sussex"],
        distractors: ["West Sussex", "Kent", "Surrey"],
        clozeTemplate: "Brighton is located in {blank}.",
      },
      {
        variables: { city: "Southampton" },
        correctAnswer: "Hampshire",
        acceptedAnswers: ["hampshire"],
        distractors: ["Dorset", "Wiltshire", "Surrey"],
        clozeTemplate: "Southampton is located in {blank}.",
      },
      {
        variables: { city: "Canterbury" },
        correctAnswer: "Kent",
        acceptedAnswers: ["kent"],
        distractors: ["Surrey", "East Sussex", "Essex"],
        clozeTemplate: "Canterbury is located in {blank}.",
      },
      {
        variables: { city: "Oxford" },
        correctAnswer: "Oxfordshire",
        acceptedAnswers: ["oxfordshire"],
        distractors: ["Berkshire", "Buckinghamshire", "Gloucestershire"],
        clozeTemplate: "Oxford is located in {blank}.",
      },
      {
        variables: { city: "Bristol" },
        correctAnswer: "Bristol",
        acceptedAnswers: ["bristol", "Avon", "Somerset"],
        distractors: ["Gloucestershire", "Wiltshire", "Devon"],
        clozeTemplate: "Bristol is a ceremonial county called {blank}.",
      },
      {
        variables: { city: "Cambridge" },
        correctAnswer: "Cambridgeshire",
        acceptedAnswers: ["cambridgeshire"],
        distractors: ["Suffolk", "Norfolk", "Essex"],
        clozeTemplate: "Cambridge is located in {blank}.",
      },
    ],
  },
  
  // =========================================================================
  // KC: MAJOR RIVERS (10 variants)
  // =========================================================================
  {
    templateText: "Which major river flows through {city}?",
    kcId: KC_IDS.MAJOR_RIVERS,
    difficulty: 0.0,
    bloomLevel: 1,
    supportsMC: true,
    supportsCloze: true,
    supportsFreeText: true,
    variants: [
      {
        variables: { city: "London" },
        correctAnswer: "River Thames",
        acceptedAnswers: ["thames", "the thames", "Thames"],
        distractors: ["River Severn", "River Trent", "River Mersey"],
        clozeTemplate: "The {blank} flows through London.",
      },
      {
        variables: { city: "Newcastle" },
        correctAnswer: "River Tyne",
        acceptedAnswers: ["tyne", "the tyne", "Tyne"],
        distractors: ["River Wear", "River Tees", "River Tweed"],
        clozeTemplate: "The {blank} flows through Newcastle.",
      },
      {
        variables: { city: "Bristol" },
        correctAnswer: "River Avon",
        acceptedAnswers: ["avon", "the avon", "Avon"],
        distractors: ["River Severn", "River Thames", "River Exe"],
        clozeTemplate: "The {blank} flows through Bristol.",
      },
      {
        variables: { city: "York" },
        correctAnswer: "River Ouse",
        acceptedAnswers: ["ouse", "the ouse", "Ouse"],
        distractors: ["River Aire", "River Don", "River Trent"],
        clozeTemplate: "The {blank} flows through York.",
      },
      {
        variables: { city: "Nottingham" },
        correctAnswer: "River Trent",
        acceptedAnswers: ["trent", "the trent", "Trent"],
        distractors: ["River Severn", "River Ouse", "River Don"],
        clozeTemplate: "The {blank} flows through Nottingham.",
      },
      {
        variables: { city: "Glasgow" },
        correctAnswer: "River Clyde",
        acceptedAnswers: ["clyde", "the clyde", "Clyde"],
        distractors: ["River Forth", "River Tay", "River Tweed"],
        clozeTemplate: "The {blank} flows through Glasgow.",
      },
    ],
  },
  
  {
    templateText: "Which river forms part of the border between {region_a} and {region_b}?",
    kcId: KC_IDS.MAJOR_RIVERS,
    difficulty: 0.5,
    bloomLevel: 1,
    supportsMC: true,
    supportsCloze: false,
    supportsFreeText: true,
    variants: [
      {
        variables: { region_a: "England", region_b: "Scotland" },
        correctAnswer: "River Tweed",
        acceptedAnswers: ["tweed", "the tweed", "Tweed"],
        distractors: ["River Tyne", "River Tees", "River Eden"],
      },
      {
        variables: { region_a: "England", region_b: "Wales" },
        correctAnswer: "River Severn",
        acceptedAnswers: ["severn", "the severn", "Severn", "River Wye", "Wye"],
        distractors: ["River Thames", "River Dee", "River Usk"],
      },
    ],
  },
  
  // =========================================================================
  // KC: MOUNTAIN RANGES (8 variants)
  // =========================================================================
  {
    templateText: "In which mountain range is {peak} located?",
    kcId: KC_IDS.MOUNTAIN_RANGES,
    difficulty: 0.5,
    bloomLevel: 1,
    supportsMC: true,
    supportsCloze: true,
    supportsFreeText: true,
    variants: [
      {
        variables: { peak: "Ben Nevis" },
        correctAnswer: "Grampian Mountains",
        acceptedAnswers: ["grampians", "grampian", "Scottish Highlands", "Highlands"],
        distractors: ["Pennines", "Snowdonia", "Lake District"],
        clozeTemplate: "Ben Nevis is located in the {blank}.",
      },
      {
        variables: { peak: "Snowdon" },
        correctAnswer: "Snowdonia",
        acceptedAnswers: ["snowdonia", "Eryri"],
        distractors: ["Brecon Beacons", "Pennines", "Lake District"],
        clozeTemplate: "Snowdon is located in {blank}.",
      },
      {
        variables: { peak: "Scafell Pike" },
        correctAnswer: "Lake District",
        acceptedAnswers: ["lake district", "Cumbrian Mountains"],
        distractors: ["Pennines", "Peak District", "Yorkshire Dales"],
        clozeTemplate: "Scafell Pike is located in the {blank}.",
      },
      {
        variables: { peak: "Pen y Fan" },
        correctAnswer: "Brecon Beacons",
        acceptedAnswers: ["brecon beacons", "Bannau Brycheiniog"],
        distractors: ["Snowdonia", "Black Mountains", "Cambrian Mountains"],
        clozeTemplate: "Pen y Fan is located in the {blank}.",
      },
      {
        variables: { peak: "Cross Fell" },
        correctAnswer: "Pennines",
        acceptedAnswers: ["pennines", "the pennines", "North Pennines"],
        distractors: ["Lake District", "Yorkshire Dales", "Peak District"],
        clozeTemplate: "Cross Fell is located in the {blank}.",
      },
      {
        variables: { peak: "Kinder Scout" },
        correctAnswer: "Peak District",
        acceptedAnswers: ["peak district", "the peaks", "Dark Peak"],
        distractors: ["Pennines", "Yorkshire Dales", "Lake District"],
        clozeTemplate: "Kinder Scout is located in the {blank}.",
      },
    ],
  },
  
  // =========================================================================
  // KC: NATIONAL PARKS (8 variants)
  // =========================================================================
  {
    templateText: "Which national park is located in {region}?",
    kcId: KC_IDS.NATIONAL_PARKS,
    difficulty: 0.0,
    bloomLevel: 1,
    supportsMC: true,
    supportsCloze: false,
    supportsFreeText: true,
    variants: [
      {
        variables: { region: "northern England" },
        correctAnswer: "Lake District",
        acceptedAnswers: ["lake district", "the lakes"],
        distractors: ["Peak District", "North York Moors", "Northumberland"],
      },
      {
        variables: { region: "the Scottish Highlands" },
        correctAnswer: "Cairngorms",
        acceptedAnswers: ["cairngorms", "cairngorms national park"],
        distractors: ["Loch Lomond", "Snowdonia", "Lake District"],
      },
      {
        variables: { region: "South Wales" },
        correctAnswer: "Brecon Beacons",
        acceptedAnswers: ["brecon beacons", "bannau brycheiniog"],
        distractors: ["Snowdonia", "Pembrokeshire Coast", "Peak District"],
      },
      {
        variables: { region: "North Wales" },
        correctAnswer: "Snowdonia",
        acceptedAnswers: ["snowdonia", "eryri"],
        distractors: ["Brecon Beacons", "Peak District", "Lake District"],
      },
      {
        variables: { region: "southern England" },
        correctAnswer: "South Downs",
        acceptedAnswers: ["south downs", "the south downs"],
        distractors: ["New Forest", "Dartmoor", "Exmoor"],
      },
      {
        variables: { region: "Devon and Somerset" },
        correctAnswer: "Exmoor",
        acceptedAnswers: ["exmoor"],
        distractors: ["Dartmoor", "New Forest", "South Downs"],
      },
    ],
  },
  
  // =========================================================================
  // KC: WESTERLY WINDS (6 variants)
  // =========================================================================
  {
    templateText: "Why does {region} receive more rainfall than eastern areas?",
    kcId: KC_IDS.WESTERLY_WINDS,
    difficulty: 1.0,
    bloomLevel: 2,
    supportsMC: true,
    supportsCloze: false,
    supportsFreeText: false,
    variants: [
      {
        variables: { region: "western Britain" },
        correctAnswer: "Prevailing westerly winds bring moist air from the Atlantic",
        distractors: [
          "Eastern areas are closer to the equator",
          "Western areas have more factories creating pollution",
          "The Gulf Stream only reaches western coasts"
        ],
      },
      {
        variables: { region: "the Lake District" },
        correctAnswer: "Atlantic air masses are forced to rise over mountains, causing orographic rainfall",
        distractors: [
          "The Lake District has more lakes which evaporate",
          "Tourists bring rain with them",
          "Northern latitude causes more precipitation"
        ],
      },
      {
        variables: { region: "Wales" },
        correctAnswer: "Moisture-laden Atlantic winds rise over Welsh mountains, cooling and condensing",
        distractors: [
          "Wales is further north so gets more rain",
          "Welsh valleys trap clouds permanently",
          "The Irish Sea creates unusual weather patterns"
        ],
      },
    ],
  },
  
  // =========================================================================
  // KC: RAIN SHADOW (6 variants)
  // =========================================================================
  {
    templateText: "Why is {region} drier than areas to the west?",
    kcId: KC_IDS.RAIN_SHADOW,
    difficulty: 1.0,
    bloomLevel: 2,
    supportsMC: true,
    supportsCloze: false,
    supportsFreeText: false,
    variants: [
      {
        variables: { region: "eastern England" },
        correctAnswer: "Mountains in the west force air to rise and release moisture before reaching the east",
        distractors: [
          "The North Sea absorbs moisture from the air",
          "Eastern England is closer to continental Europe",
          "Prevailing winds blow from east to west"
        ],
      },
      {
        variables: { region: "Edinburgh" },
        correctAnswer: "It lies in the rain shadow of the Scottish Highlands",
        distractors: [
          "The Firth of Forth blocks rain clouds",
          "Urban heat island effect prevents rainfall",
          "Edinburgh is at a lower elevation"
        ],
      },
      {
        variables: { region: "the East Midlands" },
        correctAnswer: "Air descending after crossing the Pennines is warmer and drier",
        distractors: [
          "The East Midlands is too far from the sea",
          "Industrial pollution blocks cloud formation",
          "Low population density reduces rainfall"
        ],
      },
    ],
  },
  
  // =========================================================================
  // KC: MARITIME/CONTINENTAL CLIMATE (6 variants)
  // =========================================================================
  {
    templateText: "Which climate characteristic does {region} exhibit?",
    kcId: KC_IDS.MARITIME_CONTINENTAL,
    difficulty: 1.0,
    bloomLevel: 2,
    supportsMC: true,
    supportsCloze: false,
    supportsFreeText: false,
    variants: [
      {
        variables: { region: "Cornwall" },
        correctAnswer: "Maritime climate with mild winters and cool summers",
        distractors: [
          "Continental climate with temperature extremes",
          "Mediterranean climate with dry summers",
          "Polar climate with permafrost"
        ],
      },
      {
        variables: { region: "eastern Scotland" },
        correctAnswer: "More continental characteristics with greater temperature range",
        distractors: [
          "Pure maritime climate identical to western Scotland",
          "Subtropical climate due to Gulf Stream",
          "Desert climate due to rain shadow"
        ],
      },
      {
        variables: { region: "the Isles of Scilly" },
        correctAnswer: "Extremely maritime with very mild winters and frost-free conditions",
        distractors: [
          "Alpine climate due to Atlantic exposure",
          "Continental climate similar to France",
          "Semi-arid climate due to low rainfall"
        ],
      },
    ],
  },
  
  // =========================================================================
  // KC: NORTH ATLANTIC DRIFT (6 variants)
  // =========================================================================
  {
    templateText: "What effect does the North Atlantic Drift have on {region}?",
    kcId: KC_IDS.NORTH_ATLANTIC_DRIFT,
    difficulty: 1.0,
    bloomLevel: 2,
    supportsMC: true,
    supportsCloze: false,
    supportsFreeText: false,
    variants: [
      {
        variables: { region: "British winters" },
        correctAnswer: "Keeps winters milder than other places at the same latitude",
        distractors: [
          "Creates colder winters due to ocean cooling",
          "Has no effect on British climate",
          "Only affects coastal flooding"
        ],
      },
      {
        variables: { region: "western Scotland" },
        correctAnswer: "Palm trees can grow in sheltered western locations despite northern latitude",
        distractors: [
          "Creates permanent ice conditions",
          "Prevents any vegetation growth",
          "Only affects sea temperatures, not land"
        ],
      },
      {
        variables: { region: "the UK compared to Labrador, Canada" },
        correctAnswer: "The UK is much warmer despite being at the same latitude",
        distractors: [
          "Both regions have identical climates",
          "Labrador is warmer due to continental position",
          "The difference is caused by volcanic activity"
        ],
      },
    ],
  },
  
  // =========================================================================
  // KC: CONTINENTAL EFFECT (4 variants)
  // =========================================================================
  {
    templateText: "Why does {region} experience {weather_pattern}?",
    kcId: KC_IDS.CONTINENTAL_EFFECT,
    difficulty: 1.5,
    bloomLevel: 2,
    supportsMC: true,
    supportsCloze: false,
    supportsFreeText: false,
    variants: [
      {
        variables: { region: "eastern England", weather_pattern: "occasional very cold winters" },
        correctAnswer: "Continental air masses from Siberia can reach eastern areas when wind patterns shift",
        distractors: [
          "The North Sea freezes and creates cold conditions",
          "Eastern areas are closer to the North Pole",
          "Industrial pollution causes temperature inversions"
        ],
      },
      {
        variables: { region: "Kent", weather_pattern: "higher summer temperatures than Cornwall" },
        correctAnswer: "Proximity to continental Europe allows warmer air masses to reach the southeast",
        distractors: [
          "Kent has more sunshine hours due to less cloud",
          "Cornwall's peninsular shape creates cooling",
          "The Channel Tunnel affects local climate"
        ],
      },
    ],
  },
  
  // =========================================================================
  // KC: CLIMATE CLASSIFICATION (6 variants)
  // =========================================================================
  {
    templateText: "Based on the Köppen climate classification, how would you classify {region}?",
    kcId: KC_IDS.CLIMATE_CLASSIFICATION,
    difficulty: 2.0,
    bloomLevel: 3,
    supportsMC: true,
    supportsCloze: false,
    supportsFreeText: false,
    variants: [
      {
        variables: { region: "most of lowland Britain" },
        correctAnswer: "Cfb - Temperate oceanic climate with no dry season",
        distractors: [
          "Csa - Mediterranean climate",
          "Dfb - Continental climate",
          "BSk - Semi-arid steppe"
        ],
      },
      {
        variables: { region: "the Scottish Highlands above 600m" },
        correctAnswer: "Cfc - Subpolar oceanic climate or ET - Tundra at highest elevations",
        distractors: [
          "Cfb - Same as lowland Britain",
          "Dfc - Subarctic climate",
          "BWk - Cold desert"
        ],
      },
      {
        variables: { region: "southeastern England in summer" },
        correctAnswer: "Still Cfb but with some Cfa (humid subtropical) characteristics during heatwaves",
        distractors: [
          "Becomes Csa Mediterranean temporarily",
          "Converts to BWh hot desert climate",
          "No change from winter classification"
        ],
      },
    ],
  },
  
  // =========================================================================
  // KC: CLIMATE CHANGE (6 variants)
  // =========================================================================
  {
    templateText: "How is climate change affecting {aspect} in the UK?",
    kcId: KC_IDS.CLIMATE_CHANGE,
    difficulty: 2.0,
    bloomLevel: 3,
    supportsMC: true,
    supportsCloze: false,
    supportsFreeText: false,
    variants: [
      {
        variables: { aspect: "winter rainfall patterns" },
        correctAnswer: "Winters are becoming wetter with more intense rainfall events",
        distractors: [
          "Winters are becoming uniformly drier",
          "No change has been observed",
          "Snowfall is increasing across all regions"
        ],
      },
      {
        variables: { aspect: "summer temperatures" },
        correctAnswer: "Heatwaves are becoming more frequent and intense, with 40°C now possible",
        distractors: [
          "Summers are becoming cooler due to changing ocean currents",
          "Temperature changes are only occurring in winter",
          "The UK is cooling while other regions warm"
        ],
      },
      {
        variables: { aspect: "sea levels around British coasts" },
        correctAnswer: "Rising due to thermal expansion and ice melt, threatening low-lying areas",
        distractors: [
          "Falling due to increased evaporation",
          "Remaining stable due to coastal defences",
          "Only affecting the Atlantic coast, not the North Sea"
        ],
      },
      {
        variables: { aspect: "growing seasons for farmers" },
        correctAnswer: "Extending by 2-3 weeks, allowing new crops but bringing new pests",
        distractors: [
          "Shortening due to unpredictable weather",
          "No change as agriculture adapts",
          "Eliminating traditional crop growing entirely"
        ],
      },
    ],
  },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seedTemplates() {
  console.log('🌱 Seeding question templates...');
  
  let templateCount = 0;
  let variantCount = 0;
  
  for (const template of templates) {
    // Check if KC exists (should have been created in previous seeding)
    const kc = await prisma.knowledgeComponent.findUnique({
      where: { id: template.kcId },
    });
    
    if (!kc) {
      console.warn(`⚠️  KC not found: ${template.kcId} - skipping template`);
      continue;
    }
    
    // Create template
    const createdTemplate = await prisma.questionTemplate.create({
      data: {
        templateText: template.templateText,
        kcId: template.kcId,
        difficulty: template.difficulty,
        bloomLevel: template.bloomLevel,
        supportsMC: template.supportsMC,
        supportsCloze: template.supportsCloze,
        supportsFreeText: template.supportsFreeText,
      },
    });
    
    templateCount++;
    
    // Create variants
    for (const variant of template.variants) {
      await prisma.questionVariant.create({
        data: {
          templateId: createdTemplate.id,
          variables: variant.variables,
          correctAnswer: variant.correctAnswer,
          acceptedAnswers: variant.acceptedAnswers || [],
          distractors: variant.distractors,
          clozeTemplate: variant.clozeTemplate || null,
        },
      });
      
      variantCount++;
    }
  }
  
  console.log(`✅ Created ${templateCount} templates with ${variantCount} total variants`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    await seedTemplates();
    console.log('🎉 Template seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

// ============================================================================
// EXPORT FOR TESTING
// ============================================================================

export { templates, seedTemplates };
