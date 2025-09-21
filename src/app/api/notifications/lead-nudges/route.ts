import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      orderBy: { createdAt: 'desc' }
    });

    for (const lead of leads) {
      const hasComments = lead.comments.length > 0;
      const daysSinceCreated = Math.floor((now.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const lastComment = lead.comments[0];
      const daysSinceLastComment = lastComment 
        ? Math.floor((now.getTime() - lastComment.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceCreated;

      // First comment nudges - for leads created more than 1 day ago with no comments
      if (!hasComments && daysSinceCreated >= 1) {
        notifications.push({
          type: 'first_comment',
          leadId: lead.id,
          leadName: lead.name,
          message: `Hey buddy, kick things off on ${lead.name} with a quick note.`,
          actionUrl: `/leads?leadId=${lead.id}&action=comment`
        });
      }

      // Stale follow-up nudges - for leads with comments but no activity in 2+ days
      if (hasComments && daysSinceLastComment >= 2) {
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

    // Limit to 3 notifications to avoid overwhelming the user
    const limitedNotifications = notifications.slice(0, 3);

    return NextResponse.json({
      notifications: limitedNotifications,
      total: notifications.length
    });

  } catch (error) {
    console.error("Error fetching lead nudges:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
