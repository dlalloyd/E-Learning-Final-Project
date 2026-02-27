/**
 * Prisma Seed — Test data for adaptive API development
 * Creates: 1 test user, 1 quiz, 5 geography questions with IRT parameters
 * Run: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Test User ──────────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: 'test@elearning.dev' },
    update: {},
    create: {
      email: 'test@elearning.dev',
      name: 'Test Learner',
      // Simple hash for dev only — bcrypt used in production
    password: 'dev-password-not-for-production',
      role: 'learner',
    },
  });
  console.log(`✅ User: ${user.email} (${user.id})`);

  // ── Topic ──────────────────────────────────────────────────────────────────
  const topic = await prisma.topic.upsert({
    where: { id: 'topic-uk-geography' },
    update: {},
    create: {
      id: 'topic-uk-geography',
      title: 'UK Geography',
      description: 'Counties, climate systems and geographic features',
      order: 1,
    },
  });

  // ── Lesson ─────────────────────────────────────────────────────────────────
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

  // ── Quiz ───────────────────────────────────────────────────────────────────
  const quiz = await prisma.quiz.upsert({
    where: { id: 'quiz-uk-geo-adaptive' },
    update: {},
    create: {
      id: 'quiz-uk-geo-adaptive',
      title: 'UK Geography Adaptive Assessment',
      lessonId: lesson.id,
    },
  });
  console.log(`✅ Quiz: ${quiz.title} (${quiz.id})`);

  // ── Questions with IRT 3PL Parameters ─────────────────────────────────────
  // From question_bank.json — self-pilot calibrated (26/02/2026)

  const questionsData = [
    {
      id: 'q-001',
      text: 'Which county is home to the Peak District National Park?',
      order: 1,
      irt_a: 0.85, irt_b: -0.80, irt_c: 0.25,
      bloom: 1, kc: 'UK_national_parks',
      options: [
        { text: 'Derbyshire', isCorrect: true, order: 1 },
        { text: 'Yorkshire', isCorrect: false, order: 2 },
        { text: 'Lancashire', isCorrect: false, order: 3 },
        { text: 'Staffordshire', isCorrect: false, order: 4 },
      ],
    },
    {
      id: 'q-002',
      text: 'What is the capital city of Wales?',
      order: 2,
      irt_a: 1.20, irt_b: -1.50, irt_c: 0.25,
      bloom: 1, kc: 'UK_capitals',
      options: [
        { text: 'Swansea', isCorrect: false, order: 1 },
        { text: 'Newport', isCorrect: false, order: 2 },
        { text: 'Cardiff', isCorrect: true, order: 3 },
        { text: 'Wrexham', isCorrect: false, order: 4 },
      ],
    },
    {
      id: 'q-003',
      text: 'Which county is located in the far south-west tip of England?',
      order: 3,
      irt_a: 0.90, irt_b: -0.60, irt_c: 0.25,
      bloom: 1, kc: 'UK_county_locations',
      options: [
        { text: 'Devon', isCorrect: false, order: 1 },
        { text: 'Dorset', isCorrect: false, order: 2 },
        { text: 'Somerset', isCorrect: false, order: 3 },
        { text: 'Cornwall', isCorrect: true, order: 4 },
      ],
    },
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
    {
      id: 'q-005',
      text: 'Which area of England lies in the rain shadow of the Pennines?',
      order: 5,
      irt_a: 1.30, irt_b: 0.50, irt_c: 0.25,
      bloom: 2, kc: 'pennines_rain_shadow',
      options: [
        { text: 'The Lake District', isCorrect: false, order: 1 },
        { text: 'The Yorkshire Dales', isCorrect: false, order: 2 },
        { text: 'The Vale of York', isCorrect: true, order: 3 },
        { text: 'The Peak District', isCorrect: false, order: 4 },
      ],
    },
  ];

  for (const qData of questionsData) {
    const { options, ...questionFields } = qData;

    const question = await prisma.question.upsert({
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
    console.log(`✅ Question ${question.order}: ${question.text.substring(0, 50)}... (b=${question.irt_b})`);
  }

  console.log('\n✅ Seed complete');
  console.log(`   User ID:  ${user.id}`);
  console.log(`   Quiz ID:  ${quiz.id}`);
  console.log(`\n   Test the API:`);
  console.log(`   POST /api/sessions  { "userId": "${user.id}", "quizId": "${quiz.id}", "condition": "adaptive" }`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });