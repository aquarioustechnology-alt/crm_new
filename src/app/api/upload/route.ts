import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { ensureBucketExists, getSupabaseServiceClient } from "@/lib/supabase";

// Ensure this route uses the Node.js runtime (required for fs & Buffer)
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum 50MB allowed." },
        { status: 400 }
      );
    }

    // Validate file types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const originalName = file.name || "upload";
    const sanitized = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const fileExtension = sanitized.includes(".") ? sanitized.split(".").pop() : "";
    const baseName = sanitized.replace(/\.[^.]+$/, "");
    const objectName = `comments/${timestamp}-${randomString}-${baseName}${fileExtension ? "." + fileExtension : ""}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "leadfiles";

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const supabase = getSupabaseServiceClient();
    if (supabase) {
      await ensureBucketExists(supabase, bucket, { public: true });

      const { error: uploadError } = await supabase
        .storage
        .from(bucket)
        .upload(objectName, buffer, { contentType: file.type, upsert: false });

      if (uploadError) {
        return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
      }

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectName);
      const publicUrl = pub?.publicUrl || (supabaseUrl
        ? `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${objectName}`
        : null);

      const fileInfo = {
        fileName: originalName,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: publicUrl,
      };
      return NextResponse.json(fileInfo);
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "File storage is not configured. Please contact your administrator." },
        { status: 500 }
      );
    }

    // Fallback: write to local filesystem (useful for local dev only)
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    const localPath = join(uploadsDir, objectName.replace(/^comments\//, ""));
    await writeFile(localPath, buffer);

    const fileInfo = {
      fileName: originalName,
      fileType: file.type,
      fileSize: file.size,
      fileUrl: `/uploads/${objectName.replace(/^comments\//, "")}`,
    };
    return NextResponse.json(fileInfo);
  } catch (error) {
    console.error("Error uploading file:", error);
    const message = error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json(
      { error: message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
