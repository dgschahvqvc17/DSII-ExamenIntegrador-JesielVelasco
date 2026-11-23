const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

/**
 * Cliente oficial de Supabase usado SOLO en el backend.
 * La SERVICE_ROLE_KEY nunca se expone al navegador.
 */
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_API_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: { 'X-Client-Info': 'labcare-api' },
  },
});

module.exports = supabase;
