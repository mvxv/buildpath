const test = require('node:test');
const assert = require('node:assert/strict');

const { setup, teardown } = require('./helpers/harness');

let ctx;

test.before(async () => {
  ctx = await setup();
});

test.after(async () => {
  await teardown(ctx);
});

test('authentication', async (t) => {
  await t.test('rejects a request with no token', async () => {
    assert.equal((await ctx.call('/api/user-projects')).status, 401);
  });

  await t.test('rejects a request with an unrecognised token', async () => {
    assert.equal((await ctx.call('/api/user-projects', { token: 'garbage' })).status, 401);
  });

  await t.test('creates the profile row lazily on first authenticated request', async () => {
    const before = await ctx.pg.query('SELECT COUNT(*)::int AS n FROM profiles');
    assert.equal(before.rows[0].n, 0);

    await ctx.call('/api/user-projects', { token: ctx.TOKENS.primary });

    const after = await ctx.pg.query('SELECT id FROM profiles');
    assert.equal(after.rows.length, 1);
    assert.equal(after.rows[0].id, ctx.USERS.primary.id);
  });
});

test('profile', async (t) => {
  await t.test('returns the signed-in user profile', async () => {
    const res = await ctx.call('/api/profile', { token: ctx.TOKENS.primary });
    assert.equal(res.body.email, ctx.USERS.primary.email);
  });

  await t.test('persists experience level and career goal', async () => {
    const res = await ctx.call('/api/profile', {
      method: 'PUT',
      token: ctx.TOKENS.primary,
      body: { experience_level: 'intermediate', career_goal: 'fullstack' },
    });
    assert.equal(res.body.experience_level, 'intermediate');
    assert.equal(res.body.career_goal, 'fullstack');
  });

  await t.test('rejects an invalid experience level', async () => {
    const res = await ctx.call('/api/profile', {
      method: 'PUT',
      token: ctx.TOKENS.primary,
      body: { experience_level: 'wizard' },
    });
    assert.equal(res.status, 400);
  });
});

test('saving and tracking a project', async (t) => {
  let projectId;
  let savedId;
  let stepIds;

  await t.test('saves a project', async () => {
    const list = await ctx.call('/api/projects');
    projectId = list.body[0].id;

    const res = await ctx.call('/api/user-projects', {
      method: 'POST',
      token: ctx.TOKENS.primary,
      body: { project_id: projectId },
    });

    assert.equal(res.status, 201);
    savedId = res.body.id;
  });

  await t.test('saving the same project twice is idempotent', async () => {
    const res = await ctx.call('/api/user-projects', {
      method: 'POST',
      token: ctx.TOKENS.primary,
      body: { project_id: projectId },
    });
    assert.equal(res.body.id, savedId);
  });

  await t.test('rejects a malformed project id', async () => {
    const res = await ctx.call('/api/user-projects', {
      method: 'POST',
      token: ctx.TOKENS.primary,
      body: { project_id: 'nope' },
    });
    assert.equal(res.status, 400);
  });

  await t.test('rejects a project that does not exist', async () => {
    const res = await ctx.call('/api/user-projects', {
      method: 'POST',
      token: ctx.TOKENS.primary,
      body: { project_id: ctx.ABSENT_UUID },
    });
    assert.equal(res.status, 404);
  });

  await t.test('returns the roadmap with every step incomplete', async () => {
    const res = await ctx.call(`/api/user-projects/${savedId}`, { token: ctx.TOKENS.primary });
    assert.equal(res.body.roadmap_steps.length, 5);
    assert.ok(res.body.roadmap_steps.every((step) => step.completed === false));
    stepIds = res.body.roadmap_steps.map((step) => step.id);
  });

  await t.test('marks a step complete and reports totals', async () => {
    const res = await ctx.call('/api/user-progress', {
      method: 'POST',
      token: ctx.TOKENS.primary,
      body: { user_project_id: savedId, roadmap_step_id: stepIds[0], completed: true },
    });
    assert.equal(res.body.completed, true);
    assert.equal(res.body.completed_steps, 1);
    assert.equal(res.body.total_steps, 5);
  });

  await t.test('marks a step incomplete again', async () => {
    const res = await ctx.call('/api/user-progress', {
      method: 'POST',
      token: ctx.TOKENS.primary,
      body: { user_project_id: savedId, roadmap_step_id: stepIds[0], completed: false },
    });
    assert.equal(res.body.completed, false);
    assert.equal(res.body.completed_steps, 0);
  });

  await t.test('keeps one progress row per step however often it is toggled', async () => {
    for (const completed of [true, false, true]) {
      await ctx.call('/api/user-progress', {
        method: 'POST',
        token: ctx.TOKENS.primary,
        body: { user_project_id: savedId, roadmap_step_id: stepIds[0], completed },
      });
    }
    const rows = await ctx.pg.query('SELECT COUNT(*)::int AS n FROM user_progress');
    assert.equal(rows.rows[0].n, 1);
  });

  await t.test('refuses a step belonging to a different project', async () => {
    const foreign = await ctx.pg.query(
      'SELECT rs.id FROM roadmap_steps rs WHERE rs.project_id <> $1 LIMIT 1',
      [projectId]
    );
    const res = await ctx.call('/api/user-progress', {
      method: 'POST',
      token: ctx.TOKENS.primary,
      body: { user_project_id: savedId, roadmap_step_id: foreign.rows[0].id, completed: true },
    });
    assert.equal(res.status, 404);
  });

  await t.test('surfaces progress in the saved list', async () => {
    const res = await ctx.call('/api/user-projects', { token: ctx.TOKENS.primary });
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].total_steps, 5);
    assert.equal(res.body[0].completed_steps, 1);
  });

  await t.test('isolates one user from another', async () => {
    const list = await ctx.call('/api/user-projects', { token: ctx.TOKENS.other });
    assert.deepEqual(list.body, []);

    const detail = await ctx.call(`/api/user-projects/${savedId}`, { token: ctx.TOKENS.other });
    assert.equal(detail.status, 404);

    const tick = await ctx.call('/api/user-progress', {
      method: 'POST',
      token: ctx.TOKENS.other,
      body: { user_project_id: savedId, roadmap_step_id: stepIds[1], completed: true },
    });
    assert.equal(tick.status, 404);

    const remove = await ctx.call(`/api/user-projects/${savedId}`, {
      method: 'DELETE',
      token: ctx.TOKENS.other,
    });
    assert.equal(remove.status, 404);
  });

  await t.test('removes the project and cascades its progress away', async () => {
    const res = await ctx.call(`/api/user-projects/${savedId}`, {
      method: 'DELETE',
      token: ctx.TOKENS.primary,
    });
    assert.equal(res.status, 204);

    const rows = await ctx.pg.query('SELECT COUNT(*)::int AS n FROM user_progress');
    assert.equal(rows.rows[0].n, 0);

    const again = await ctx.call(`/api/user-projects/${savedId}`, {
      method: 'DELETE',
      token: ctx.TOKENS.primary,
    });
    assert.equal(again.status, 404);
  });
});
