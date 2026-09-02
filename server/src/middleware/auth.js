const { supabaseAdmin } = require('../supabaseClient');

/**
 * Verifying a token means asking Supabase about it over the network, which from a
 * server in another region costs more than every database query on the request put
 * together. Tokens are opaque to us and already short-lived, so each verified one
 * is held briefly and the round trip is skipped on repeat calls.
 *
 * What is cached is the in-flight promise rather than its result, which also
 * collapses concurrent verifications of the same token into one request. That is
 * the common case: opening the app fires several authenticated calls at once, and
 * a result-only cache would let every one of them miss and go to the network.
 *
 * The trade-off is that a revoked session keeps working for up to TTL_MS. A minute
 * sits well inside the token's own lifetime, so the window widens negligibly.
 */
const TTL_MS = 60_000;
const MAX_ENTRIES = 500;

/** token -> { promise: Promise<user|null>, expiresAt: number } */
const cache = new Map();

function evictOldest() {
  if (cache.size >= MAX_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
}

function verify(token) {
  const hit = cache.get(token);

  if (hit) {
    if (Date.now() <= hit.expiresAt) {
      // Re-insert so the map's first key stays the least recently used.
      cache.delete(token);
      cache.set(token, hit);
      return hit.promise;
    }
    cache.delete(token);
  }

  const promise = supabaseAdmin.auth
    .getUser(token)
    .then(({ data, error }) => {
      if (error || !data?.user) {
        // A rejection must never be remembered, or a token that becomes valid
        // later would keep failing for the rest of the TTL.
        cache.delete(token);
        return null;
      }
      return data.user;
    })
    .catch((err) => {
      cache.delete(token);
      throw err;
    });

  evictOldest();
  cache.set(token, { promise, expiresAt: Date.now() + TTL_MS });
  return promise;
}

function bearerToken(req) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

/** Rejects anything without a valid Supabase access token; sets `req.user`. */
async function requireAuth(req, res, next) {
  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  try {
    const user = await verify(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Drops a token from the cache. Exported for tests. */
function forgetToken(token) {
  cache.delete(token);
}

module.exports = { requireAuth, forgetToken };
