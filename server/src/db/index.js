const { Pool } = require('pg');
const config = require('../config');

// Supabase requires TLS. Its pooler presents a certificate that does not chain to
// a root in Node's default store, so verification is disabled rather than the
// encryption itself. This matches Supabase's own connection guidance.
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
