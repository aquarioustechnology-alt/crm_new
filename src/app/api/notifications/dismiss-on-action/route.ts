import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadId, actionType } = await req.json();

    if (!leadId || !actionType) {
      return NextResponse.json({ error: "leadId and actionType are required" }, { status: 400 });
    }

    // Determine notification type based on action
    let notificationType: string;
    
    switch (actionType) {
      case 'comment_added':
        // If a comment was added, dismiss first_comment notifications
        notificationType = 'first_comment';
        break;
      case 'lead_updated':
        // If lead was updated (status change, etc.), dismiss stale_followup notifications
        notificationType = 'stale_followup';
        break;
      default:
        return NextResponse.json({ error: "Invalid actionType" }, { status: 400 });
    }

    // Store dismissed notification for this specific user
    await prisma.dismissedNotification.upsert({
      where: {
        userId_leadId_type: {
          userId: user.id,
          leadId: leadId,
          type: notificationType
        }
      },
      update: {
        dismissedAt: new Date()
      },
      create: {
        userId: user.id,
        leadId: leadId,
        type: notificationType,
        dismissedAt: new Date()
      }
    });

    console.log(`🔔 Auto-dismissed ${notificationType} notification for user ${user.id}, lead ${leadId}, action ${actionType}`);

    return NextResponse.json({ 
      success: true, 
      message: `Dismissed ${notificationType} notification due to ${actionType}` 
    });
  } catch (error) {
    console.error("Error auto-dismissing notification:", error);
    return NextResponse.json({ error: "Failed to auto-dismiss notification" }, { status: 500 });
  }
}
