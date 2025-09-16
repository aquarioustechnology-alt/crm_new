import { createClient } from '@supabase/supabase-js';

// Client-side Supabase instance (uses public anon key)
export const supabaseClient = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon, { auth: { persistSession: false } });
})();