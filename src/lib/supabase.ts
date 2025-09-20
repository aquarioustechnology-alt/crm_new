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

export async function ensureBucketExists(
  client: SupabaseClient,
  bucket: string,
  options: { public?: boolean } = {}
): Promise<void> {
  const { public: isPublic = true } = options;

  const { data: buckets, error: listError } = await client.storage.listBuckets();
  if (listError) {
    throw new Error(`Unable to list storage buckets: ${listError.message}`);
  }

  if (buckets?.some((b) => b.name === bucket)) {
    return;
  }

  const { error: createError } = await client.storage.createBucket(bucket, {
    public: isPublic,
  });

  if (createError && !createError.message.includes('already exists')) {
    throw new Error(`Unable to create storage bucket "${bucket}": ${createError.message}`);
  }
}
