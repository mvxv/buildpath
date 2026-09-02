/**
 * Test harness.
 *
 * Boots the real Express app against PGlite — an in-process Postgres — so every
 * route, SQL query, and constraint is exercised for real without needing a
 * Supabase project or any credentials. Only two things are swapped out:
 *
 *   - the pg pool, pointed at PGlite instead of a remote database
 *   - Supabase token verification, which would otherwise need a live auth server
 *
 * Because there is no `auth` schema in a bare Postgres, a minimal stand-in is
 * created first so db/001_init.sql applies unmodified.
 */

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '../../..');

const USERS = {
  primary: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'student@example.com',
    user_metadata: { name: 'Student' },
  },
  other: {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'other@example.com',
    user_metadata: {},
  },
};

const TOKENS = { primary: 'token-primary', other: 'token-other' };

/** A uuid that is well-formed but will never exist. */
const ABSENT_UUID = '33333333-3333-4333-8333-333333333333';

async function setup() {
  const { PGlite } = await import('@electric-sql/pglite');
  const pg = new PGlite();

  await pg.exec(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE auth.users (id UUID PRIMARY KEY, email TEXT);
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
  `);

  for (const user of Object.values(USERS)) {
    await pg.query('INSERT INTO auth.users (id, email) VALUES ($1, $2)', [user.id, user.email]);
  }

  await pg.exec(fs.readFileSync(path.join(REPO_ROOT, 'db/001_init.sql'), 'utf8'));

  // pg reports rowCount; PGlite reports affectedRows and rows.
  const query = async (text, params) => {
    const result = await pg.query(text, params);
    return { rows: result.rows, rowCount: result.rows.length || result.affectedRows || 0 };
  };

  const dbPath = require.resolve(path.join(REPO_ROOT, 'server/src/db/index.js'));
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { query, pool: null } };

  const supabasePath = require.resolve(path.join(REPO_ROOT, 'server/src/supabaseClient.js'));
  require.cache[supabasePath] = {
    id: supabasePath,
    filename: supabasePath,
    loaded: true,
    exports: {
      supabaseAdmin: {
        auth: {
          getUser: async (token) => {
            const key = Object.keys(TOKENS).find((name) => TOKENS[name] === token);
            if (!key) return { data: null, error: { message: 'invalid token' } };
            return { data: { user: USERS[key] }, error: null };
          },
        },
      },
    },
  };

  process.env.DATABASE_URL = 'postgres://test';
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test';
  process.env.CORS_ORIGINS = 'https://buildpath.example.com';

  await seedCatalog(pg);

  const app = require(path.join(REPO_ROOT, 'server/src/index.js'));
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  /** Issue a request against the running app. */
  const call = async (route, { method = 'GET', body, token, origin } = {}) => {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    if (origin) headers.Origin = origin;

    const response = await fetch(`${baseUrl}${route}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }

    return { status: response.status, body: payload, headers: response.headers };
  };

  return { pg, server, call, USERS, TOKENS, ABSENT_UUID };
}

/** Loads the real seed catalog with the same statements seed.js uses. */
async function seedCatalog(pg) {
  const projects = require(path.join(REPO_ROOT, 'seed/projects.js'));

  for (const project of projects) {
    const { rows } = await pg.query(
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
      await pg.query(
        'INSERT INTO roadmap_steps (project_id, step_order, title, description) VALUES ($1, $2, $3, $4)',
        [projectId, index + 1, step.title, step.description]
      );
    }

    for (const resource of project.resources) {
      await pg.query('INSERT INTO resources (project_id, type, url, label) VALUES ($1, $2, $3, $4)', [
        projectId,
        resource.type,
        resource.url,
        resource.label,
      ]);
    }
  }
}

async function teardown(context) {
  if (context?.server) {
    await new Promise((resolve) => context.server.close(resolve));
  }
}

module.exports = { setup, teardown };
