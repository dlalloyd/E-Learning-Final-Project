// Seed script for Knowledge Components
// Run with: npx ts-node prisma/seedKCs.ts

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
  
  // L2 → L2: westerly winds are prerequisite for understanding rain shadow
  { fromKCId: 'westerly_winds_rainfall', toKCId: 'pennines_rain_shadow', masteryThreshold: 0.8 },
  // Level 3 depends on Level 2
  { fromKCId: 'maritime_continental', toKCId: 'climate_classification', masteryThreshold: 0.8 },
  { fromKCId: 'continental_effect', toKCId: 'climate_classification', masteryThreshold: 0.8 },
  { fromKCId: 'north_atlantic_drift', toKCId: 'climate_change_application', masteryThreshold: 0.8 },
  { fromKCId: 'UK_rivers', toKCId: 'flood_risk_integration', masteryThreshold: 0.8 },
  { fromKCId: 'pennines_rain_shadow', toKCId: 'flood_risk_integration', masteryThreshold: 0.8 },
  { fromKCId: 'westerly_winds_rainfall', toKCId: 'flood_risk_integration', masteryThreshold: 0.8 },
];

async function main() {
  console.log('🌱 Seeding Knowledge Components...\n');

  // Seed Knowledge Components
  for (const kc of knowledgeComponents) {
    const created = await prisma.knowledgeComponent.upsert({
      where: { id: kc.id },
      update: kc,
      create: kc,
    });
    console.log(`  ✅ KC: ${created.id} (Bloom ${created.bloomLevel})`);
  }

  console.log('\n🔗 Seeding Prerequisite Edges...\n');

  // Seed Prerequisite Edges
  for (const edge of prerequisiteEdges) {
    const created = await prisma.prerequisiteEdge.upsert({
      where: {
        fromKCId_toKCId: {
          fromKCId: edge.fromKCId,
          toKCId: edge.toKCId,
        },
      },
      update: edge,
      create: edge,
    });
    console.log(`  ✅ Edge: ${edge.fromKCId} → ${edge.toKCId} (threshold: ${edge.masteryThreshold})`);
  }

  console.log('\n── Summary ─────────────────────────────────────');
  console.log(`   Knowledge Components: ${knowledgeComponents.length}`);
  console.log(`   Level 1 (Remembering): 5`);
  console.log(`   Level 2 (Understanding): 5`);
  console.log(`   Level 3 (Applying): 3`);
  console.log(`   Prerequisite Edges: ${prerequisiteEdges.length}`);
  console.log('─────────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });