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

test('health', async (t) => {
  await t.test('reports liveness', async () => {
    const res = await ctx.call('/health');
    assert.equal(res.body.status, 'ok');
  });

  await t.test('reports database connectivity', async () => {
    const res = await ctx.call('/health/db');
    assert.equal(res.body.database, 'connected');
  });
});

test('project library', async (t) => {
  await t.test('lists the whole catalog, beginner projects first', async () => {
    const res = await ctx.call('/api/projects');
    assert.equal(res.body.length, 14);
    assert.equal(res.body[0].difficulty, 'beginner');
    assert.equal(typeof res.body[0].step_count, 'number');
  });

  await t.test('filters by difficulty', async () => {
    const res = await ctx.call('/api/projects?difficulty=beginner');
    assert.equal(res.body.length, 7);
    assert.ok(res.body.every((p) => p.difficulty === 'beginner'));
  });

  await t.test('filters by category', async () => {
    const res = await ctx.call('/api/projects?category=dev-tools');
    assert.equal(res.body.length, 2);
  });

  await t.test('filters by career goal held in JSONB', async () => {
    const res = await ctx.call('/api/projects?career_goal=devops');
    assert.equal(res.body.length, 2);
  });

  await t.test('searches title and description', async () => {
    const res = await ctx.call('/api/projects?q=chat');
    assert.equal(res.body.length, 1);
  });

  await t.test('combines filters with AND', async () => {
    const res = await ctx.call('/api/projects?difficulty=intermediate&category=web-app');
    assert.ok(res.body.every((p) => p.difficulty === 'intermediate' && p.category === 'web-app'));
  });

  await t.test('returns an empty array when nothing matches', async () => {
    const res = await ctx.call('/api/projects?q=zzzznothing');
    assert.deepEqual(res.body, []);
  });
});

test('project metadata', async (t) => {
  await t.test('exposes filter options and the tech vocabulary', async () => {
    const res = await ctx.call('/api/projects/meta');
    assert.equal(res.body.categories.length, 4);
    assert.equal(res.body.career_goals.length, 5);
    assert.equal(res.body.total, 14);
    assert.ok(res.body.tech_stack.includes('React'));
  });
});

test('project detail', async (t) => {
  await t.test('includes an ordered roadmap and resources', async () => {
    const list = await ctx.call('/api/projects');
    const res = await ctx.call(`/api/projects/${list.body[0].id}`);
    assert.equal(res.body.roadmap_steps.length, 5);
    assert.ok(res.body.roadmap_steps.every((s, i) => s.step_order === i + 1));
    assert.ok(res.body.resources.length >= 2);
  });

  await t.test('rejects a malformed id with 400', async () => {
    const res = await ctx.call('/api/projects/not-a-uuid');
    assert.equal(res.status, 400);
  });

  await t.test('returns 404 for an unknown id', async () => {
    const res = await ctx.call(`/api/projects/${ctx.ABSENT_UUID}`);
    assert.equal(res.status, 404);
  });
});

test('matching quiz', async (t) => {
  await t.test('ranks a beginner data-viz brief sensibly', async () => {
    const res = await ctx.call('/api/quiz/match', {
      method: 'POST',
      body: {
        experience_level: 'beginner',
        career_goal: 'frontend',
        hours_available: 12,
        interests: ['data-viz'],
        tech: ['React'],
      },
    });

    assert.equal(res.body.matches.length, 5);
    assert.equal(res.body.matches[0].title, 'Weather Dashboard with Saved Locations');
    assert.ok(res.body.matches[0].reasons.length > 0);
  });

  await t.test('ranks an advanced devops brief sensibly', async () => {
    const res = await ctx.call('/api/quiz/match', {
      method: 'POST',
      body: {
        experience_level: 'advanced',
        career_goal: 'devops',
        hours_available: 60,
        interests: ['dev-tools'],
      },
    });
    assert.equal(res.body.matches[0].title, 'CLI Task Runner with Web Dashboard');
  });

  await t.test('sorts descending and bounds the percentage', async () => {
    const res = await ctx.call('/api/quiz/match', { method: 'POST', body: { experience_level: 'beginner' } });
    const scores = res.body.matches.map((m) => m.score);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
    assert.ok(res.body.matches.every((m) => m.match_percent >= 0 && m.match_percent <= 100));
  });

  await t.test('still returns results when no answers are given', async () => {
    const res = await ctx.call('/api/quiz/match', { method: 'POST', body: {} });
    assert.equal(res.body.matches.length, 5);
  });

  await t.test('respects the limit', async () => {
    const res = await ctx.call('/api/quiz/match', { method: 'POST', body: { limit: 3 } });
    assert.equal(res.body.matches.length, 3);
  });
});
