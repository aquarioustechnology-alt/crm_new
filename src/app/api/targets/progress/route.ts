import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { convertCurrency } from "@/lib/currency";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "MONTHLY";
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const quarter = searchParams.get("quarter");
  const userId = searchParams.get("userId");

  try {
    const isAdmin = session.user.role === "ADMIN";
    const targetUserId = userId || session.user.id;

    // Get current date for period calculations
    const now = new Date();
    const currentYear = parseInt(year || '') || now.getFullYear();
    const currentMonth = parseInt(month || '') || (now.getMonth() + 1);
    const currentQuarter = parseInt(quarter || '') || Math.ceil((now.getMonth() + 1) / 3);

    // Build date range for lead filtering
    let startDate: Date;
    let endDate: Date;

    if (period === "MONTHLY") {
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0);
    } else if (period === "QUARTERLY") {
      const quarterStartMonth = (currentQuarter - 1) * 3;
      startDate = new Date(currentYear, quarterStartMonth, 1);
      endDate = new Date(currentYear, quarterStartMonth + 3, 0);
    } else {
      // YEARLY
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31);
    }

    // In rationalized system, we only store MONTHLY USER targets
    // Calculate targets based on period requested
    let calculatedTargets = [];
    
    if (period === "MONTHLY") {
      // Get monthly targets directly
      const monthlyWhereClause: any = {
        period: "MONTHLY",
        targetType: "USER",
        year: currentYear,
        month: currentMonth,
      };
      
      if (!isAdmin) {
        monthlyWhereClause.userId = session.user.id;
      } else if (userId) {
        monthlyWhereClause.userId = targetUserId;
      }
      
      const monthlyTargets = await prisma.target.findMany({
        where: monthlyWhereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      });
      
      calculatedTargets = [...monthlyTargets];
      
      // Add company target as sum of all user targets for this month
      if (isAdmin || !userId) {
        const allMonthlyTargets = await prisma.target.findMany({
          where: {
            period: "MONTHLY",
            targetType: "USER",
            year: currentYear,
            month: currentMonth,
          }
        });
        
        if (allMonthlyTargets.length > 0) {
          const companyAmount = allMonthlyTargets.reduce((sum, target) => sum + parseFloat(target.amount.toString()), 0);
          calculatedTargets.push({
            id: `company-monthly-${currentYear}-${currentMonth}`,
            amount: new Decimal(companyAmount),
            currency: allMonthlyTargets[0].currency,
            period: "MONTHLY",
            targetType: "COMPANY",
            year: currentYear,
            month: currentMonth,
            quarter: null,
            userId: null,
            user: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: null
          });
        }
      }
      
    } else if (period === "QUARTERLY") {
      // Get all monthly targets for the quarter and sum them up
      const quarterStartMonth = (currentQuarter - 1) * 3 + 1;
      const quarterEndMonth = quarterStartMonth + 2;
      
      const monthlyWhereClause: any = {
        period: "MONTHLY",
        targetType: "USER",
        year: currentYear,
        month: {
          gte: quarterStartMonth,
          lte: quarterEndMonth
        }
      };
      
      if (!isAdmin) {
        monthlyWhereClause.userId = session.user.id;
      } else if (userId) {
        monthlyWhereClause.userId = targetUserId;
      }
      
      const monthlyTargets = await prisma.target.findMany({
        where: monthlyWhereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      });
      
      // Group by user and sum the amounts
      const userQuarterlyTargets = new Map();
      monthlyTargets.forEach(target => {
        const key = target.userId || 'unknown';
        if (!userQuarterlyTargets.has(key)) {
          userQuarterlyTargets.set(key, {
            ...target,
            id: `quarterly-${target.userId}-${currentYear}-${currentQuarter}`,
            period: "QUARTERLY",
            quarter: currentQuarter,
            month: null,
            amount: 0
          });
        }
        const quarterlyTarget = userQuarterlyTargets.get(key);
        quarterlyTarget.amount += parseFloat(target.amount.toString());
      });
      
      calculatedTargets = Array.from(userQuarterlyTargets.values());
      
      // Add company quarterly target
      if (isAdmin || !userId) {
        const allMonthlyTargets = await prisma.target.findMany({
          where: {
            period: "MONTHLY",
            targetType: "USER",
            year: currentYear,
            month: {
              gte: quarterStartMonth,
              lte: quarterEndMonth
            }
          }
        });
        
        if (allMonthlyTargets.length > 0) {
          const companyAmount = allMonthlyTargets.reduce((sum, target) => sum + parseFloat(target.amount.toString()), 0);
          calculatedTargets.push({
            id: `company-quarterly-${currentYear}-${currentQuarter}`,
            amount: new Decimal(companyAmount),
            currency: allMonthlyTargets[0].currency,
            period: "QUARTERLY",
            targetType: "COMPANY",
            year: currentYear,
            month: null,
            quarter: currentQuarter,
            userId: null,
            user: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: null
          });
        }
      }
      
    } else {
      // YEARLY - sum all monthly targets for the year
      const monthlyWhereClause: any = {
        period: "MONTHLY",
        targetType: "USER",
        year: currentYear
      };
      
      if (!isAdmin) {
        monthlyWhereClause.userId = session.user.id;
      } else if (userId) {
        monthlyWhereClause.userId = targetUserId;
      }
      
      const monthlyTargets = await prisma.target.findMany({
        where: monthlyWhereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      });
      
      // Group by user and sum the amounts
      const userYearlyTargets = new Map();
      monthlyTargets.forEach(target => {
        const key = target.userId || 'unknown';
        if (!userYearlyTargets.has(key)) {
          userYearlyTargets.set(key, {
            ...target,
            id: `yearly-${target.userId}-${currentYear}`,
            period: "YEARLY",
            quarter: null,
            month: null,
            amount: 0
          });
        }
        const yearlyTarget = userYearlyTargets.get(key);
        yearlyTarget.amount += parseFloat(target.amount.toString());
      });
      
      calculatedTargets = Array.from(userYearlyTargets.values());
      
      // Add company yearly target
      if (isAdmin || !userId) {
        const allMonthlyTargets = await prisma.target.findMany({
          where: {
            period: "MONTHLY",
            targetType: "USER",
            year: currentYear
          }
        });
        
        if (allMonthlyTargets.length > 0) {
          const companyAmount = allMonthlyTargets.reduce((sum, target) => sum + parseFloat(target.amount.toString()), 0);
          calculatedTargets.push({
            id: `company-yearly-${currentYear}`,
            amount: new Decimal(companyAmount),
            currency: allMonthlyTargets[0].currency,
            period: "YEARLY",
            targetType: "COMPANY",
            year: currentYear,
            month: null,
            quarter: null,
            userId: null,
            user: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: null
          });
        }
      }
    }

    // Get leads for progress calculation
    const leadWhereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: "WON",
      projectValue: {
        not: null,
      },
    };

    // Filter leads based on user access
    if (!isAdmin || userId) {
      leadWhereClause.ownerId = targetUserId;
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
      }
    });

    // Calculate progress for each target
    const progressData = calculatedTargets.map(target => {
      let relevantLeads = wonLeads;

      // For user targets, filter to that specific user's leads
      if (target.targetType === "USER" && target.userId) {
        relevantLeads = wonLeads.filter(lead => lead.ownerId === target.userId);
      }

      // Calculate achieved amount (convert currencies if needed)
      const achievedAmount = relevantLeads.reduce((sum, lead) => {
        if (!lead.projectValue) return sum;
        const normalized = convertCurrency(lead.projectValue, lead.currency, target.currency);
        return sum + normalized;
      }, 0);

      const targetAmount = parseFloat(target.amount.toString());
      const progressPercentage = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0;

      return {
        target,
        achievedAmount: Math.round(achievedAmount * 100) / 100,
        targetAmount,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        remainingAmount: Math.max(0, targetAmount - achievedAmount),
        dealsCount: relevantLeads.length,
        isAchieved: achievedAmount >= targetAmount,
        period: {
          type: period || "MONTHLY",
          year: currentYear,
          month: period === "MONTHLY" ? currentMonth : undefined,
          quarter: period === "QUARTERLY" ? currentQuarter : undefined,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }
      };
    });

    // Calculate overall summary (deduplicate deals across targets)
    const uniqueLeadIds = new Set<string>((wonLeads || []).map(l => l.id));
    
    // Separate user and company targets for proper aggregation
    const userTargets = progressData.filter(p => p.target.targetType === "USER");
    const companyTargets = progressData.filter(p => p.target.targetType === "COMPANY");
    
    // Calculate total achieved amount without double-counting
    // Use either user targets total OR company targets total (not both)
    const totalAchievedAmount = companyTargets.length > 0 
      ? Math.max(...companyTargets.map(p => p.achievedAmount)) // Use the highest company achievement
      : userTargets.reduce((sum, p) => sum + p.achievedAmount, 0); // Or sum of user achievements
    
    // Calculate total target amount without double-counting
    const totalTargetAmount = companyTargets.length > 0
      ? Math.max(...companyTargets.map(p => p.targetAmount)) // Use the highest company target
      : userTargets.reduce((sum, p) => sum + p.targetAmount, 0); // Or sum of user targets

    const summary = {
      totalTargets: progressData.length,
      achievedTargets: progressData.filter(p => p.isAchieved).length,
      totalTargetAmount,
      totalAchievedAmount,
      totalDeals: uniqueLeadIds.size,
      overallProgress: 0,
    };

    if (summary.totalTargetAmount > 0) {
      summary.overallProgress = Math.round((summary.totalAchievedAmount / summary.totalTargetAmount) * 100 * 100) / 100;
    }

    return NextResponse.json({
      progress: progressData,
      summary,
      period: {
        type: period || "MONTHLY",
        year: currentYear,
        month: period === "MONTHLY" ? currentMonth : undefined,
        quarter: period === "QUARTERLY" ? currentQuarter : undefined,
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to calculate target progress" }, { status: 500 });
  }
}
