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

test('CORS', async (t) => {
  const header = (res) => res.headers.get('access-control-allow-origin');

  await t.test('allows an origin listed in CORS_ORIGINS', async () => {
    const res = await ctx.call('/api/projects', { origin: 'https://buildpath.example.com' });
    assert.equal(header(res), 'https://buildpath.example.com');
  });

  await t.test('always allows the Vite dev server', async () => {
    const res = await ctx.call('/api/projects', { origin: 'http://localhost:5173' });
    assert.equal(header(res), 'http://localhost:5173');
  });

  await t.test('omits the header for an unlisted origin instead of erroring', async () => {
    const res = await ctx.call('/api/projects', { origin: 'https://evil.example.com' });
    assert.equal(header(res), null);
    assert.notEqual(res.status, 500);
  });
});

test('unknown routes return a JSON 404', async () => {
  const res = await ctx.call('/api/does-not-exist');
  assert.equal(res.status, 404);
  assert.ok(res.body.error);
});
