// Creates test users in the live DB for UI/flow testing via testmail.app
// Password for all: TestPass123!
// Run: node scripts/create-test-users.js

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const TEST_PASSWORD = 'TestPass123!';

const TEST_USERS = [
  { tag: 'learner1', name: 'Test Learner 1',   condition: 'adaptive' },
  { tag: 'learner2', name: 'Test Learner 2',   condition: 'adaptive' },
  { tag: 'learner3', name: 'Test Learner 3',   condition: 'static'   },
  { tag: 'learner4', name: 'Test Learner 4',   condition: 'static'   },
  { tag: 'admin',    name: 'Test Admin',        condition: 'adaptive', role: 'admin' },
];

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  const hash = await bcrypt.hash(TEST_PASSWORD, 12);
  console.log(`\nPassword hash generated. Creating users...\n`);

  for (const u of TEST_USERS) {
    const email = `vuibz.${u.tag}@inbox.testmail.app`;
    const role  = u.role ?? 'learner';
    const id    = crypto.randomBytes(12).toString('hex');

    try {
      await client.query(
        `INSERT INTO "User" (id, email, name, password, role, "studyCondition", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name,
               password = EXCLUDED.password,
               role = EXCLUDED.role,
               "studyCondition" = EXCLUDED."studyCondition",
               "updatedAt" = NOW()`,
        [id, email, u.name, hash, role, u.condition]
      );
      console.log(`  created  ${email}  [${role}, ${u.condition}]`);
    } catch (err) {
      console.error(`  FAILED   ${email}: ${err.message}`);
    }
  }

  await client.end();
  console.log(`\nDone. Login with any of the above + password: ${TEST_PASSWORD}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
