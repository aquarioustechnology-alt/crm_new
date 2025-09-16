import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function parsePublicUrl(u: string) {
  try {
    const url = new URL(u);
    // Expected format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('object');
    if (idx >= 0) {
      const scope = parts[idx + 1]; // 'public' or 'sign'
      const bucket = parts[idx + 2];
      const path = parts.slice(idx + 3).join('/');
      if (bucket && path) return { bucket, path };
    }
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const urlParam = searchParams.get('url');
  const bucketParam = searchParams.get('bucket');
  const pathParam = searchParams.get('path');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const fallbackBucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  let bucket = bucketParam || fallbackBucket;
  let objectPath = pathParam || '';

  if (!objectPath && urlParam) {
    const parsed = parsePublicUrl(urlParam);
    if (parsed) {
      bucket = parsed.bucket;
      objectPath = parsed.path;
    }
  }

  if (!bucket || !objectPath) {
    return NextResponse.json({ error: 'Missing bucket or path' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message || 'Failed to create signed URL' }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
}