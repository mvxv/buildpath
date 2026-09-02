const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Service-role client. Used only to verify access tokens server-side; it must
// never be exposed to the browser.
const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = { supabaseAdmin };
