import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";

type AttachmentInput = {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
};

async function ensureLeadAccess(
  leadId: string
): Promise<NextResponse<{ error: string }> | null> {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, ownerId: true },
  });

  const isAdmin = user.role === "ADMIN";
  const isOwner = lead?.ownerId === user.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return null;
}

// GET - Fetch all comments for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authError = await ensureLeadAccess(id);

    if (authError) {
      return authError;
    }

    const comments = await prisma.comment.findMany({
      where: {
        leadId: id,
      },
      include: {
        attachments: true,
      },
      orderBy: {
        createdAt: "desc", // Latest comments first
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authError = await ensureLeadAccess(id);

    if (authError) {
      return authError;
    }

    const body = (await request.json()) as {
      content?: string;
      attachments?: AttachmentInput[];
    };

    const attachments = Array.isArray(body.attachments)
      ? body.attachments
      : [];
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Create comment with attachments
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        leadId: id,
        attachments: {
          create: attachments.map((attachment) => ({
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            fileUrl: attachment.fileUrl,
          })),
        },
      },
      include: {
        attachments: true,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
