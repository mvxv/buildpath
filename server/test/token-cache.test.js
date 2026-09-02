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

test('token verification cache', async (t) => {
  await t.test('verifies a token against Supabase only once per burst', async () => {
    ctx.forgetToken(ctx.TOKENS.primary);
    const before = ctx.verifications.count;

    for (let i = 0; i < 5; i += 1) {
      const res = await ctx.call('/api/user-projects', { token: ctx.TOKENS.primary });
      assert.equal(res.status, 200);
    }

    // One network round trip for five requests, instead of five.
    assert.equal(ctx.verifications.count - before, 1);
  });

  await t.test('re-verifies once the token is forgotten', async () => {
    const before = ctx.verifications.count;
    ctx.forgetToken(ctx.TOKENS.primary);

    await ctx.call('/api/user-projects', { token: ctx.TOKENS.primary });
    assert.equal(ctx.verifications.count - before, 1);
  });

  await t.test('never caches a token it rejected', async () => {
    const before = ctx.verifications.count;

    for (let i = 0; i < 3; i += 1) {
      const res = await ctx.call('/api/user-projects', { token: 'not-a-real-token' });
      assert.equal(res.status, 401);
    }

    assert.equal(ctx.verifications.count - before, 3);
  });

  await t.test('collapses a concurrent burst into one verification', async () => {
    ctx.forgetToken(ctx.TOKENS.primary);
    const before = ctx.verifications.count;

    const responses = await Promise.all(
      Array.from({ length: 8 }, () => ctx.call('/api/user-projects', { token: ctx.TOKENS.primary }))
    );

    assert.ok(responses.every((res) => res.status === 200));
    assert.equal(ctx.verifications.count - before, 1);
  });

  await t.test('keeps users apart in the cache', async () => {
    const first = await ctx.call('/api/profile', { token: ctx.TOKENS.primary });
    const second = await ctx.call('/api/profile', { token: ctx.TOKENS.other });
    assert.equal(first.body.id, ctx.USERS.primary.id);
    assert.equal(second.body.id, ctx.USERS.other.id);
  });
});
