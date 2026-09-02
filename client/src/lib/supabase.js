import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * True when Supabase credentials are present. The library and quiz work without
 * them, so a misconfigured .env degrades to "browsing works, sign-in does not"
 * instead of a blank screen.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase is not configured. Copy client/.env.example to client/.env and set ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable accounts and progress tracking.'
  );
}

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
