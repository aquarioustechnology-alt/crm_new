import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Helper function to calculate targets for different periods from monthly data
function calculateTargetsForPeriod(monthlyTargets: any[], requestedPeriod: string | null, year: string | null, month: string | null, quarter: string | null, isAdmin: boolean) {
  if (!requestedPeriod || requestedPeriod === "MONTHLY") {
    // Return monthly targets as-is, plus calculated company targets
    const result = [...monthlyTargets];
    
    // Add calculated company monthly targets
    const monthlyCompanyTargets = calculateCompanyTargets(monthlyTargets, "MONTHLY", year, month);
    result.push(...monthlyCompanyTargets);
    
    return result;
  }
  
  if (requestedPeriod === "QUARTERLY") {
    // Calculate quarterly targets from monthly data
    const quarterlyTargets = calculateQuarterlyTargets(monthlyTargets, year, quarter);
    const companyQuarterlyTargets = calculateCompanyTargets(quarterlyTargets, "QUARTERLY", year, null, quarter);
    return [...quarterlyTargets, ...companyQuarterlyTargets];
  }
  
  if (requestedPeriod === "YEARLY") {
    // Calculate yearly targets from monthly data
    const yearlyTargets = calculateYearlyTargets(monthlyTargets, year);
    const companyYearlyTargets = calculateCompanyTargets(yearlyTargets, "YEARLY", year);
    return [...yearlyTargets, ...companyYearlyTargets];
  }
  
  return monthlyTargets;
}

// Calculate company targets as sum of all user targets
function calculateCompanyTargets(userTargets: any[], period: string, year: string | null, month: string | null = null, quarter: string | null = null) {
  const groupedTargets = new Map();
  
  userTargets.forEach(target => {
    const key = `${target.year}-${target.month || ''}-${target.quarter || ''}-${period}`;
    if (!groupedTargets.has(key)) {
      groupedTargets.set(key, {
        id: `company-${period.toLowerCase()}-${target.year}-${target.month || target.quarter || 'all'}`,
        amount: 0,
        currency: target.currency,
        targetType: "COMPANY",
        userId: null,
        user: null,
        period: period,
        year: target.year,
        month: target.month,
        quarter: target.quarter,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        admin: null
      });
    }
    const companyTarget = groupedTargets.get(key);
    companyTarget.amount += parseFloat(target.amount.toString());
  });
  
  return Array.from(groupedTargets.values());
}

// Calculate quarterly targets from monthly data
function calculateQuarterlyTargets(monthlyTargets: any[], year: string | null, quarter: string | null) {
  const quarterlyMap = new Map();
  
  monthlyTargets.forEach(target => {
    const targetQuarter = Math.ceil(target.month / 3);
    
    // Filter by requested quarter if specified
    if (quarter && targetQuarter !== parseInt(quarter)) {
      return;
    }
    
    const key = `${target.userId}-${target.year}-${targetQuarter}`;
    if (!quarterlyMap.has(key)) {
      quarterlyMap.set(key, {
        ...target,
        id: `quarterly-${target.userId}-${target.year}-${targetQuarter}`,
        period: "QUARTERLY",
        quarter: targetQuarter,
        month: null,
        amount: 0
      });
    }
    
    const quarterlyTarget = quarterlyMap.get(key);
    quarterlyTarget.amount += parseFloat(target.amount.toString());
  });
  
  return Array.from(quarterlyMap.values());
}

// Calculate yearly targets from monthly data
function calculateYearlyTargets(monthlyTargets: any[], year: string | null) {
  const yearlyMap = new Map();
  
  monthlyTargets.forEach(target => {
    // Filter by requested year if specified
    if (year && target.year !== parseInt(year)) {
      return;
    }
    
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
    
    const yearlyTarget = yearlyMap.get(key);
    yearlyTarget.amount += parseFloat(target.amount.toString());
  });
  
  return Array.from(yearlyMap.values());
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedPeriod = searchParams.get("period"); // "MONTHLY", "QUARTERLY", "YEARLY"
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const quarter = searchParams.get("quarter");
  const targetType = searchParams.get("targetType"); // "COMPANY", "USER", or "ALL"
  const userId = searchParams.get("userId"); // For admin to get specific user's targets

  try {
    const isAdmin = session.user.role === "ADMIN";
    
    // Base where clause - we only store MONTHLY targets now
    let whereClause: any = {
      period: "MONTHLY", // Only fetch monthly targets
      ...(year && { year: parseInt(year) }),
      ...(month && { month: parseInt(month) }),
    };

    // Filter by user access
    if (isAdmin) {
      // Admin can see all user targets
      if (userId) {
        whereClause.userId = userId;
        whereClause.targetType = "USER";
      } else if (targetType === "USER") {
        whereClause.targetType = "USER";
      }
      // If no specific filter, return all USER targets (no COMPANY targets as they're auto-calculated)
    } else {
      // Regular users can only see their own targets
      whereClause.userId = session.user.id;
      whereClause.targetType = "USER";
    }

    const monthlyTargets = await prisma.target.findMany({
      where: whereClause,
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
        { user: { firstName: "asc" } },
      ],
    });
    

    // Filter out orphaned targets (where user no longer exists)
    const validTargets = monthlyTargets.filter(target => {
      // For USER targets, ensure user exists
      if (target.targetType === 'USER' && !target.user) {
        console.warn(`Found orphaned target ${target.id} with missing user ${target.userId}`);
        return false;
      }
      return true;
    });

    // Now calculate the requested period view using valid targets only
    const calculatedTargets = calculateTargetsForPeriod(validTargets, requestedPeriod, year, month, quarter, isAdmin);

    return NextResponse.json(calculatedTargets);
  } catch (error) {
    console.error("Error fetching targets:", error);
    return NextResponse.json({ error: "Failed to fetch targets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { amount, currency = "INR", year, month, userId } = body;

    if (!amount || !year || !month || !userId) {
      return NextResponse.json(
        { error: "Amount, year, month, and userId are required" },
        { status: 400 }
      );
    }

    // Validate month range
    const monthNum = parseInt(month);
    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: "Month must be between 1 and 12" },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 400 }
      );
    }

    // Prepare the monthly target data
    const targetData = {
      amount: parseFloat(amount),
      currency,
      period: "MONTHLY", // Always monthly in new system
      year: parseInt(year),
      month: parseInt(month),
      quarter: null, // Not used for monthly
      targetType: "USER", // Always USER in new system (company calculated)
      userId: userId,
      createdBy: session.user.id,
    };

    // Find existing target for this user/month/year
    const existingTarget = await prisma.target.findFirst({
      where: {
        targetType: "USER",
        userId: userId,
        period: "MONTHLY",
        year: parseInt(year),
        month: parseInt(month),
      },
    });

    let target;
    if (existingTarget) {
      // Update existing target
      target = await prisma.target.update({
        where: { id: existingTarget.id },
        data: {
          amount: parseFloat(amount),
          currency,
          createdBy: session.user.id,
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
        }
      });
    } else {
      // Create new target
      target = await prisma.target.create({
        data: targetData,
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
        }
      });
    }

    return NextResponse.json(target, { status: 201 });
  } catch (error) {
    console.error("Error creating/updating target:", error);
    return NextResponse.json({ error: "Failed to create target" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Target ID is required" }, { status: 400 });
    }

    // Check if target exists before trying to delete
    const existingTarget = await prisma.target.findUnique({
      where: { id }
    });

    if (!existingTarget) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    await prisma.target.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Target deleted successfully" });
  } catch (error) {
    console.error("Error deleting target:", error);
    
    // Handle specific Prisma error codes
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }
    
    return NextResponse.json({ error: "Failed to delete target" }, { status: 500 });
  }
}
