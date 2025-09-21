import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadId, type } = await req.json();

    if (!leadId || !type) {
      return NextResponse.json({ error: "leadId and type are required" }, { status: 400 });
    }

    // Store dismissed notification
    await prisma.dismissedNotification.upsert({
      where: {
        userId_leadId_type: {
          userId: user.id,
          leadId: leadId,
          type: type
        }
      },
      update: {
        dismissedAt: new Date()
      },
      create: {
        userId: user.id,
        leadId: leadId,
        type: type,
        dismissedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error dismissing notification:", error);
    return NextResponse.json({ error: "Failed to dismiss notification" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clear all dismissed notifications for the user
    await prisma.dismissedNotification.deleteMany({
      where: {
        userId: user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing dismissed notifications:", error);
    return NextResponse.json({ error: "Failed to clear dismissed notifications" }, { status: 500 });
  }
}
