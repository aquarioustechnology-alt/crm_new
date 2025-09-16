import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

    const result: any = {
      env: {
        hasUrl: !!supabaseUrl,
        hasAnon: !!anon,
        hasServiceKey: !!serviceKey,
        bucket,
      },
      bucketExists: null as null | boolean,
      canCreateSignedUpload: null as null | boolean,
      details: {} as any,
    };

    if (supabaseUrl && serviceKey) {
      const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

      // Check buckets
      const { data: buckets, error: listErr } = await sb.storage.listBuckets();
      if (listErr) {
        result.details.listBucketsError = listErr.message;
      } else {
        result.bucketExists = !!buckets?.some((b: any) => b.name === bucket);
      }

      // Try signed-upload creation (no object write)
      const ts = Date.now();
      const path = `diagnostics/${ts}-probe.txt`;
      const { data: signed, error: signErr } = await sb.storage.from(bucket).createSignedUploadUrl(path);
      if (signErr || !signed) {
        result.canCreateSignedUpload = false;
        result.details.createSignedUploadUrlError = signErr?.message || 'Unknown error creating signed upload URL';
      } else {
        result.canCreateSignedUpload = true;
      }
    }

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}