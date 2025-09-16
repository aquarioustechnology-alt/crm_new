import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client using Service Role key (never expose this to the client)
export function getSupabaseServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}