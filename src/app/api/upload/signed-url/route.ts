import { NextRequest, NextResponse } from 'next/server';
import { ensureBucketExists, getSupabaseServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType } = await req.json();
    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'leadfiles';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured on the server' }, { status: 500 });
    }

    await ensureBucketExists(supabase, bucket, { public: true });

    // Build object path
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const originalName = String(fileName);
    const sanitized = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileExtension = sanitized.includes('.') ? sanitized.split('.').pop() : '';
    const baseName = sanitized.replace(/\.[^.]+$/, '');
    const path = `comments/${timestamp}-${randomString}-${baseName}${fileExtension ? '.' + fileExtension : ''}`;

    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) {
      return NextResponse.json({ error: error?.message || `Failed to create signed upload URL for bucket=${bucket} path=${path}` }, { status: 500 });
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = pub?.publicUrl || (supabaseUrl
      ? `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${path}`
      : null);

    return NextResponse.json({
      bucket,
      path,
      token: data.token,
      publicUrl,
      fileType: fileType || null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
