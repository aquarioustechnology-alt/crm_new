import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    console.log('🔔 Notification API: Starting request...');
    
    const user = await getCurrentUser();
    if (!user) {
      console.log('🔔 Notification API: No user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log('🔔 Notification API: User authenticated:', user.email);

    const now = new Date();
    const notifications: Array<{
      type: 'first_comment' | 'stale_followup';
      leadId: string;
      leadName: string;
      message: string;
      actionUrl?: string;
      daysSince?: number;
    }> = [];

    // Get leads owned by the current user (or all leads for admins)
    const whereClause = user.role === 'ADMIN' ? {} : { ownerId: user.id };
    
    console.log('🔔 Notification API: Fetching leads...');
    
    // Get dismissed notifications for this user
    const dismissedNotifications = await prisma.dismissedNotification.findMany({
      where: {
        userId: user.id
      },
      select: {
        leadId: true,
        type: true
      }
    });
    
    // Create a set of dismissed notification keys for quick lookup
    const dismissedKeys = new Set(
      dismissedNotifications.map(d => `${d.leadId}:${d.type}`)
    );
    
    const leads = await prisma.lead.findMany({
      where: {
        ...whereClause,
        isActive: true,
        // Exclude closed/won/lost leads
        status: {
          notIn: ['CLOSED', 'WON', 'LOST']
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        status: true,
        comments: {
          select: {
            id: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 leads to prevent large queries
    });
    
    console.log('🔔 Notification API: Found', leads.length, 'leads');

    for (const lead of leads) {
      const hasComments = lead.comments.length > 0;
      const daysSinceCreated = Math.floor((now.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const lastComment = lead.comments[0];
      const daysSinceLastComment = lastComment 
        ? Math.floor((now.getTime() - lastComment.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceCreated;

      // First comment nudges - for leads created more than 1 day ago with no comments
      if (!hasComments && daysSinceCreated >= 1) {
        const notificationKey = `${lead.id}:first_comment`;
        if (!dismissedKeys.has(notificationKey)) {
          notifications.push({
            type: 'first_comment',
            leadId: lead.id,
            leadName: lead.name,
            message: `Hey buddy, kick things off on ${lead.name} with a quick note.`,
            actionUrl: `/leads?leadId=${lead.id}&action=comment`
          });
        }
      }

      // Stale follow-up nudges - for leads with comments but no activity in 2+ days
      if (hasComments && daysSinceLastComment >= 2) {
        const notificationKey = `${lead.id}:stale_followup`;
        if (!dismissedKeys.has(notificationKey)) {
          notifications.push({
            type: 'stale_followup',
            leadId: lead.id,
            leadName: lead.name,
            message: `Friendly poke 👋 — ${lead.name} hasn't moved in ${daysSinceLastComment} days. What's the plan?`,
            actionUrl: `/leads?leadId=${lead.id}&action=comment`,
            daysSince: daysSinceLastComment
          });
        }
      }
    }

    // Show all notifications (removed limit for better user experience)
    const allNotifications = notifications;
    
    console.log('🔔 Notification API: Generated', notifications.length, 'notifications, returning', allNotifications.length);

    return NextResponse.json({
      notifications: allNotifications,
      total: notifications.length
    });

  } catch (error) {
    console.error("Error fetching lead nudges:", error);
    // Return empty notifications array instead of error to prevent client crashes
    return NextResponse.json({
      notifications: [],
      total: 0
    });
  }
}
