/**
 * Applies the SQL files in db/ against DATABASE_URL, in filename order.
 *
 *   node db/migrate.js          apply every migration
 *   node db/migrate.js --dry    list what would run, and the current tables
 *
 * Every file is written to be idempotent, so re-running is safe and is the
 * intended way to bring an existing database up to date.
 *
 * Reads DATABASE_URL from server/.env so credentials live in exactly one place.
 */

const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });

const DRY_RUN = process.argv.includes('--dry');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Fill in server/.env first.');
  process.exit(1);
}

const files = fs
  .readdirSync(__dirname)
  .filter((name) => name.endsWith('.sql'))
  .sort();

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    const before = await client.query(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name`
    );
    console.log(`tables before: ${before.rows.map((r) => r.table_name).join(', ') || '(none)'}\n`);

    if (DRY_RUN) {
      console.log('--dry: would run', files.join(', '));
      return;
    }

    for (const file of files) {
      process.stdout.write(`  ${file} ... `);
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      await client.query(sql);
      console.log('ok');
    }

    const after = await client.query(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name`
    );
    console.log(`\ntables after:  ${after.rows.map((r) => r.table_name).join(', ')}`);

    // The point of 002: user_projects must hang off Supabase's auth.users.
    //
    // Read this from pg_catalog rather than information_schema. The latter only
    // shows constraints whose referenced table you own, and auth.users belongs to
    // supabase_auth_admin -- so information_schema reports "no foreign key" on a
    // perfectly good constraint.
    const fk = await client.query(`
      SELECT fns.nspname AS ref_schema, frel.relname AS ref_table
        FROM pg_constraint con
        JOIN pg_class rel     ON rel.oid = con.conrelid
        JOIN pg_class frel    ON frel.oid = con.confrelid
        JOIN pg_namespace fns ON fns.oid = frel.relnamespace
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
       WHERE con.contype = 'f'
         AND rel.relname = 'user_projects'
         AND att.attname = 'user_id'
    `);
    const target = fk.rows[0];
    console.log(
      `user_projects.user_id -> ${target ? `${target.ref_schema}.${target.ref_table}` : '(NO FOREIGN KEY - 002 did not apply)'}`
    );
  } finally {
    await client.end();
  }
}

migrate().catch((err) => {
  console.error('\nMigration failed:', err.message);
  process.exit(1);
});
