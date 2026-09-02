const { supabaseAdmin } = require('../supabaseClient');
const db = require('../db');

function bearerToken(req) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

/**
 * Verifies the Supabase access token and attaches `req.user`.
 *
 * Also makes sure a `profiles` row exists for the user. Supabase Auth owns
 * auth.users, and we deliberately do not put a trigger on the auth schema, so the
 * first authenticated request is where a profile appears (handoff section 8.1,
 * Path A). It is a single insert that no-ops once the row is there.
 */
async function requireAuth(req, res, next) {
  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = data.user;

    await db.query(
      `INSERT INTO profiles (id, email, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [data.user.id, data.user.email, data.user.user_metadata?.name || null]
    );

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireAuth };
