import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { convertCurrency } from "@/lib/currency";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const yearFilter = searchParams.get("year");
    const periodFilter = searchParams.get("period");

    console.log('Simple achievements API - Filters:', {
      userId,
      yearFilter,
      periodFilter,
      isAdmin: session.user.role === "ADMIN"
    });

    const isAdmin = session.user.role === "ADMIN";
    const requestingUserId = isAdmin ? (userId || null) : session.user.id;

    // Get monthly targets (simplified - no complex calculations yet)
    const monthlyTargets = await prisma.target.findMany({
      where: {
        period: "MONTHLY",
        targetType: "USER",
        ...(yearFilter && { year: parseInt(yearFilter) }),
        ...(isAdmin && userId && userId !== "ALL" && userId !== "COMPANY" && { userId: userId })
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    console.log('Monthly targets found:', monthlyTargets.length);

    // Filter out orphaned targets
    const validMonthlyTargets = monthlyTargets.filter(target => target.user);
    console.log('Valid targets:', validMonthlyTargets.length);

    // Simple filtering (no complex calculations)
    let filteredTargets = validMonthlyTargets;
    
    if (isAdmin) {
      if (userId === "COMPANY") {
        filteredTargets = []; // No company targets in this simple version
      } else if (userId && userId !== "ALL") {
        filteredTargets = validMonthlyTargets.filter(t => t.userId === userId);
      }
      // For "ALL", show all targets
    } else {
      filteredTargets = validMonthlyTargets.filter(t => t.userId === requestingUserId);
    }

    console.log('Filtered targets:', filteredTargets.length);

    // Simple achievement calculation for each target
    const achievements = await Promise.all(
      filteredTargets.map(async (target) => {
        // Skip targets without month (shouldn't happen for monthly targets, but safety check)
        if (!target.month || !target.year) {
          console.log(`Skipping target ${target.id} - missing month or year`);
          return null;
        }

        // Simple date range for the target month
        const startDate = new Date(target.year, target.month - 1, 1);
        const endDate = new Date(target.year, target.month, 0);

        console.log(`Processing target ${target.id} for ${target.year}/${target.month}`);

        // Get won leads for this target period
        const wonLeads = await prisma.lead.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: "WON",
            projectValue: {
              not: null,
            },
            ...(target.userId ? { ownerId: target.userId } : {})
          }
        });

        console.log(`Found ${wonLeads.length} won leads for target ${target.id}`);

        // Calculate achieved amount
        const achievedAmount = wonLeads.reduce((sum, lead) => {
          if (!lead.projectValue) return sum;
          const normalized = convertCurrency(lead.projectValue, lead.currency, target.currency);
          return sum + normalized;
        }, 0);

        const targetAmount = parseFloat(target.amount.toString());
        const achievementPercentage = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0;
        const isAchieved = achievedAmount >= targetAmount;

        return {
          id: target.id,
          targetType: target.targetType,
          period: target.period,
          periodDisplay: `${target.month}/${target.year}`,
          year: target.year,
          month: target.month,
          targetAmount: Math.round(targetAmount * 100) / 100,
          achievedAmount: Math.round(achievedAmount * 100) / 100,
          achievementPercentage: Math.round(achievementPercentage * 100) / 100,
          isAchieved,
          status: isAchieved ? "ACHIEVED" : "NOT_ACHIEVED",
          currency: target.currency,
          dealsCount: wonLeads.length,
          user: target.user ? {
            id: target.user.id,
            name: `${target.user.firstName} ${target.user.lastName}`,
            email: target.user.email
          } : null
        };
      })
    );

    // Filter out null values (targets without month/year)
    const validAchievements = achievements.filter(achievement => achievement !== null);

    console.log('Achievements calculated:', validAchievements.length);

    // Simple summary
    const summary = {
      totalTargets: validAchievements.length,
      achievedTargets: validAchievements.filter(a => a.isAchieved).length,
      failedTargets: validAchievements.filter(a => !a.isAchieved).length,
      achievementRate: validAchievements.length > 0 ? (validAchievements.filter(a => a.isAchieved).length / validAchievements.length) * 100 : 0,
      totalTargetAmount: validAchievements.reduce((sum, a) => sum + a.targetAmount, 0),
      totalAchievedAmount: validAchievements.reduce((sum, a) => sum + a.achievedAmount, 0),
      totalDeals: validAchievements.reduce((sum, a) => sum + a.dealsCount, 0)
    };

    return NextResponse.json({
      achievements: validAchievements,
      summary,
      meta: {
        isAdmin,
        userId: requestingUserId,
        filters: {
          year: yearFilter,
          period: periodFilter,
          user: userId
        }
      }
    });

  } catch (error) {
    console.error("Simple achievements API error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      error: "Simple achievements API failed", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
