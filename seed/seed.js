/**
 * Seeds the BuildPath library with curated portfolio projects, each with its
 * roadmap steps and resources. The catalog itself lives in ./projects.js.
 *
 *   node seed/seed.js            insert projects, skipping titles already present
 *   node seed/seed.js --reset    delete every existing project first, then insert
 *
 * --reset cascades to roadmap_steps and resources, and therefore also to any saved
 * user_projects and user_progress rows pointing at them. Safe while building; think
 * twice once real users exist.
 *
 * Reads DATABASE_URL from server/.env, so credentials live in exactly one place.
 */

const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });

const projects = require('./projects');

const RESET = process.argv.includes('--reset');

if (!process.env.DATABASE_URL) {
  console.error(
    'DATABASE_URL is not set. Fill in server/.env before seeding.'
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;

  try {
    await client.query('BEGIN');

    if (RESET) {
      const { rowCount } = await client.query('DELETE FROM projects');
      console.log(`--reset: deleted ${rowCount} existing project(s), cascading to steps and resources.`);
    }

    for (const project of projects) {
      const existing = await client.query('SELECT id FROM projects WHERE title = $1', [project.title]);
      if (existing.rowCount > 0) {
        console.log(`  skip    ${project.title} (already present)`);
        skipped += 1;
        continue;
      }

      const { rows } = await client.query(
        `INSERT INTO projects
           (title, description, difficulty, est_hours, category, tech_stack, career_goals, prerequisites)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          project.title,
          project.description,
          project.difficulty,
          project.est_hours,
          project.category,
          JSON.stringify(project.tech_stack),
          JSON.stringify(project.career_goals),
          project.prerequisites,
        ]
      );
      const projectId = rows[0].id;

      for (const [index, step] of project.roadmap.entries()) {
        await client.query(
          `INSERT INTO roadmap_steps (project_id, step_order, title, description)
           VALUES ($1, $2, $3, $4)`,
          [projectId, index + 1, step.title, step.description]
        );
      }

      for (const resource of project.resources) {
        await client.query(
          `INSERT INTO resources (project_id, type, url, label)
           VALUES ($1, $2, $3, $4)`,
          [projectId, resource.type, resource.url, resource.label]
        );
      }

      console.log(
        `  insert  ${project.title} (${project.roadmap.length} steps, ${project.resources.length} resources)`
      );
      inserted += 1;
    }

    await client.query('COMMIT');
    console.log(`\nSeed complete: ${inserted} inserted, ${skipped} skipped.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\nSeed failed and was rolled back:', err.message);
    if (/column .*career_goals.* does not exist/i.test(err.message)) {
      console.error('The schema is out of date. Run `npm run migrate` first.');
    }
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
