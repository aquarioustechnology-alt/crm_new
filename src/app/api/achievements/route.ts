import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { convertCurrency } from "@/lib/currency";

// Helper function to calculate targets for achievements from monthly data
function calculateTargetsForAchievements(
  monthlyTargets: any[],
  periodFilter: string | null,
  yearFilter: string | null,
  isAdmin: boolean,
  requestingUserId: string | null
) {
  let calculatedTargets: any[] = [];
  
  if (periodFilter === "ALL") {
    // Return all periods (monthly, quarterly, yearly)
    const monthly = [...monthlyTargets, ...calculateMonthlyCompanyTargets(monthlyTargets)];
    const quarterlyUserTargets = calculateQuarterlyFromMonthly(monthlyTargets);
    const quarterly = [...quarterlyUserTargets, ...calculateQuarterlyCompanyTargets(quarterlyUserTargets)];
    const yearlyUserTargets = calculateYearlyFromMonthly(monthlyTargets);
    const yearly = [...yearlyUserTargets, ...calculateYearlyCompanyTargets(yearlyUserTargets)];
    calculatedTargets = [...monthly, ...quarterly, ...yearly];
  } else if (!periodFilter || periodFilter === "MONTHLY") {
    // Return monthly user targets + calculated company targets
    calculatedTargets = [...monthlyTargets];

    // Add company targets (sum of all users for each month)
    const companyTargets = calculateMonthlyCompanyTargets(monthlyTargets);
    calculatedTargets.push(...companyTargets);
  } else if (periodFilter === "QUARTERLY") {
    // Calculate quarterly targets from monthly
    const quarterlyUserTargets = calculateQuarterlyFromMonthly(monthlyTargets);
    const quarterlyCompanyTargets = calculateQuarterlyCompanyTargets(quarterlyUserTargets);
    calculatedTargets = [...quarterlyUserTargets, ...quarterlyCompanyTargets];
  } else if (periodFilter === "YEARLY") {
    // Calculate yearly targets from monthly
    const yearlyUserTargets = calculateYearlyFromMonthly(monthlyTargets);
    const yearlyCompanyTargets = calculateYearlyCompanyTargets(yearlyUserTargets);
    calculatedTargets = [...yearlyUserTargets, ...yearlyCompanyTargets];
  } else {
    // Fallback to monthly if an unknown period is provided
    calculatedTargets = [...monthlyTargets, ...calculateMonthlyCompanyTargets(monthlyTargets)];
  }
  
  // Filter based on user access and userId parameter
  return filterTargetsByAccess(calculatedTargets, isAdmin, requestingUserId);
}

function calculateMonthlyCompanyTargets(monthlyTargets: any[]) {
  const companyTargets = new Map();
  
  monthlyTargets.forEach(target => {
    const key = `${target.year}-${target.month}`;
    if (!companyTargets.has(key)) {
      companyTargets.set(key, {
        ...target,
        id: `company-monthly-${target.year}-${target.month}`,
        targetType: "COMPANY",
        userId: null,
        user: null,
        amount: 0
      });
    }
    companyTargets.get(key).amount += parseFloat(target.amount.toString());
  });
  
  return Array.from(companyTargets.values());
}

function calculateQuarterlyFromMonthly(monthlyTargets: any[]) {
  const quarterlyMap = new Map();
  
  monthlyTargets.forEach(target => {
    const quarter = Math.ceil(target.month / 3);
    const key = `${target.userId}-${target.year}-${quarter}`;
    
    if (!quarterlyMap.has(key)) {
      quarterlyMap.set(key, {
        ...target,
        id: `quarterly-${target.userId}-${target.year}-${quarter}`,
        period: "QUARTERLY",
        quarter: quarter,
        month: null,
        amount: 0
      });
    }
    
    quarterlyMap.get(key).amount += parseFloat(target.amount.toString());
  });
  
  return Array.from(quarterlyMap.values());
}

function calculateQuarterlyCompanyTargets(quarterlyUserTargets: any[]) {
  const companyTargets = new Map();
  
  quarterlyUserTargets.forEach(target => {
    const key = `${target.year}-${target.quarter}`;
    if (!companyTargets.has(key)) {
      companyTargets.set(key, {
        ...target,
        id: `company-quarterly-${target.year}-${target.quarter}`,
        targetType: "COMPANY",
        userId: null,
        user: null,
        amount: 0
      });
    }
    companyTargets.get(key).amount += parseFloat(target.amount.toString());
  });
  
  return Array.from(companyTargets.values());
}

function calculateYearlyFromMonthly(monthlyTargets: any[]) {
  const yearlyMap = new Map();
  
  monthlyTargets.forEach(target => {
    const key = `${target.userId}-${target.year}`;
    
    if (!yearlyMap.has(key)) {
      yearlyMap.set(key, {
        ...target,
        id: `yearly-${target.userId}-${target.year}`,
        period: "YEARLY",
        quarter: null,
        month: null,
        amount: 0
      });
    }
    
    yearlyMap.get(key).amount += parseFloat(target.amount.toString());
  });
  
  return Array.from(yearlyMap.values());
}

function calculateYearlyCompanyTargets(yearlyUserTargets: any[]) {
  const companyTargets = new Map();
  
  yearlyUserTargets.forEach(target => {
    const key = `${target.year}`;
    if (!companyTargets.has(key)) {
      companyTargets.set(key, {
        ...target,
        id: `company-yearly-${target.year}`,
        targetType: "COMPANY",
        userId: null,
        user: null,
        amount: 0
      });
    }
    companyTargets.get(key).amount += parseFloat(target.amount.toString());
  });
  
  return Array.from(companyTargets.values());
}

function filterTargetsByAccess(targets: any[], isAdmin: boolean, userId: string | null) {
  if (isAdmin) {
    if (userId === "COMPANY") {
      // Show only company targets
      return targets.filter(t => t.targetType === "COMPANY");
    } else if (userId && userId !== "ALL") {
      // Show specific user + company targets for that user
      return targets.filter(t => t.targetType === "COMPANY" || t.userId === userId);
    }
    // Show all targets (ALL users + company)
    return targets;
  } else {
    // Regular users see their own + company targets
    return targets.filter(t => t.targetType === "COMPANY" || t.userId === userId);
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId"); // For admin to filter specific user
  const yearFilter = searchParams.get("year"); // Filter by specific year
  const periodFilter = searchParams.get("period"); // "MONTHLY", "QUARTERLY", "YEARLY"

  try {
    const isAdmin = session.user.role === "ADMIN";
    // For filtering: if admin selects a specific user, filter by that user
    // Otherwise, show all users (for admins) or just the current user (for regular users)
    const requestingUserId = isAdmin ? userId : session.user.id;
    
    console.log('Achievements API - Filters:', {
      userId,
      yearFilter,
      periodFilter,
      isAdmin,
      requestingUserId,
      sessionUserId: session.user.id
    });
    


    // Get all monthly targets (source of truth)
    const monthlyTargets = await prisma.target.findMany({
      where: {
        period: "MONTHLY", // Only get monthly targets
        targetType: "USER", // Only user targets (company calculated)
        ...(yearFilter && { year: parseInt(yearFilter) }),
        // Filter by user if specific user is requested (for admin filtering)
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
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: [
        { year: "desc" },
        { month: "desc" },
        { user: { firstName: "asc" } }
      ],
    });
    
    
    // Filter out targets without valid users (orphaned targets)
    const validMonthlyTargets = monthlyTargets.filter(target => target.user);
    
    console.log('Achievements API - Monthly targets found:', {
      totalTargets: monthlyTargets.length,
      validTargets: validMonthlyTargets.length,
      targetsByUser: validMonthlyTargets.reduce((acc, target) => {
        const userId = target.userId;
        if (userId) {
          acc[userId] = (acc[userId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    });
    
    // Calculate targets for the requested period using valid targets only
    const targets = calculateTargetsForAchievements(
      validMonthlyTargets,
      periodFilter,
      yearFilter,
      isAdmin,
      requestingUserId
    );
    

    // Track unique deals across all targets to avoid double counting
    const uniqueLeadIds = new Set<string>();

    // Calculate achievements for each target
    const achievements = await Promise.all(
      targets.map(async (target) => {
        // Calculate date range for this target
        let startDate: Date;
        let endDate: Date;

        if (target.period === "MONTHLY" && target.month) {
          startDate = new Date(target.year, target.month - 1, 1);
          endDate = new Date(target.year, target.month, 0);
        } else if (target.period === "QUARTERLY" && target.quarter) {
          const quarterStartMonth = (target.quarter - 1) * 3;
          startDate = new Date(target.year, quarterStartMonth, 1);
          endDate = new Date(target.year, quarterStartMonth + 3, 0);
        } else {
          // YEARLY
          startDate = new Date(target.year, 0, 1);
          endDate = new Date(target.year, 11, 31);
        }

        // Get leads for this target period
        let leadWhereClause: any = {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: "Won",
          projectValue: {
            not: null,
          },
        };

        // Filter leads by user for USER targets
        if (target.targetType === "USER" && target.userId) {
          leadWhereClause.ownerId = target.userId;
        } else if (target.targetType === "COMPANY") {
          // For company targets, behavior depends on admin filtering
          if (isAdmin && userId && userId !== "ALL" && userId !== "COMPANY") {
            // If admin is viewing specific user, show company performance for that user only
            leadWhereClause.ownerId = userId;
          }
          // Otherwise include all leads for company targets (no additional filtering)
        }

        const wonLeads = await prisma.lead.findMany({
          where: leadWhereClause,
          select: {
            id: true,
            projectValue: true,
            currency: true,
            status: true,
            createdAt: true,
            ownerId: true,
            owner: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        });

        // Calculate achieved amount (convert currencies if needed)
        // Add to global unique deals set
        wonLeads.forEach(lead => uniqueLeadIds.add(lead.id));

        const achievedAmount = wonLeads.reduce((sum, lead) => {
          if (!lead.projectValue) return sum;
          const normalized = convertCurrency(lead.projectValue, lead.currency, target.currency);
          return sum + normalized;
        }, 0);

        const targetAmount = parseFloat(target.amount.toString());
        const achievementPercentage = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0;
        const isAchieved = achievedAmount >= targetAmount;

        // Format period display
        let periodDisplay = "";
        if (target.period === "MONTHLY") {
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          periodDisplay = `${monthNames[(target.month || 1) - 1]} ${target.year}`;
        } else if (target.period === "QUARTERLY") {
          periodDisplay = `Q${target.quarter} ${target.year}`;
        } else {
          periodDisplay = `${target.year}`;
        }

        return {
          id: target.id,
          targetType: target.targetType,
          period: target.period,
          periodDisplay,
          year: target.year,
          month: target.month,
          quarter: target.quarter,
          targetAmount: Math.round(targetAmount * 100) / 100,
          achievedAmount: Math.round(achievedAmount * 100) / 100,
          achievementPercentage: Math.round(achievementPercentage * 100) / 100,
          isAchieved,
          status: isAchieved ? "ACHIEVED" : "NOT_ACHIEVED",
          currency: target.currency,
          dealsCount: wonLeads.length,
          remainingAmount: Math.max(0, targetAmount - achievedAmount),
          user: target.user ? {
            id: target.user.id,
            name: `${target.user.firstName} ${target.user.lastName}`,
            email: target.user.email
          } : null,
          admin: target.admin ? {
            id: target.admin.id,
            name: `${target.admin.firstName} ${target.admin.lastName}`,
            email: target.admin.email
          } : null,
          createdAt: target.createdAt,
          updatedAt: target.updatedAt,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          }
        };
      })
    );

    // Calculate summary statistics
    const totalTargets = achievements.length;
    const achievedTargets = achievements.filter(a => a.isAchieved).length;
    
    // Separate user and company achievements to avoid double-counting
    const userAchievements = achievements.filter(a => a.targetType === "USER");
    const companyAchievements = achievements.filter(a => a.targetType === "COMPANY");
    
    // Calculate totals without double-counting
    // Use company achievements if available (they represent aggregated totals)
    // Otherwise use user achievements sum
    const totalTargetAmount = companyAchievements.length > 0
      ? companyAchievements.reduce((sum, a) => sum + a.targetAmount, 0)
      : userAchievements.reduce((sum, a) => sum + a.targetAmount, 0);
      
    const totalAchievedAmount = companyAchievements.length > 0
      ? companyAchievements.reduce((sum, a) => sum + a.achievedAmount, 0)
      : userAchievements.reduce((sum, a) => sum + a.achievedAmount, 0);
    
    const overallAchievementRate = totalTargets > 0 ? (achievedTargets / totalTargets) * 100 : 0;
    const overallAmountPercentage = totalTargetAmount > 0 ? (totalAchievedAmount / totalTargetAmount) * 100 : 0;

    
    const totalDeals = uniqueLeadIds.size;

    const summary = {
      totalTargets,
      achievedTargets,
      failedTargets: totalTargets - achievedTargets,
      achievementRate: Math.round(overallAchievementRate * 100) / 100,
      totalTargetAmount: Math.round(totalTargetAmount * 100) / 100,
      totalAchievedAmount: Math.round(totalAchievedAmount * 100) / 100,
      amountPercentage: Math.round(overallAmountPercentage * 100) / 100,
      totalDeals
    };

    const response = NextResponse.json({
      achievements,
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
    
    // Add caching headers - cache for 5 minutes with stale-while-revalidate
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    return response;

  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }
}
