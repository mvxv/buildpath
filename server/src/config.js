const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        'Copy server/.env.example to server/.env and fill in the values from your Supabase project.'
    );
  }
  return value;
}

// Vite's dev server is always allowed so a fresh clone works with no config.
const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const corsOrigins = [
  ...DEFAULT_ORIGINS,
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
];

module.exports = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl: required('DATABASE_URL'),
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  corsOrigins: [...new Set(corsOrigins)],
  isProduction: process.env.NODE_ENV === 'production',
};
