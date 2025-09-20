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
    const timeRange = searchParams.get("timeRange") || "month";
    const isAdmin = session.user.role === "ADMIN";

    // Calculate date range
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);

    let startDate: Date;
    let endDate: Date;

    if (timeRange === 'month') {
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0);
    } else if (timeRange === 'quarter') {
      const quarterStartMonth = (currentQuarter - 1) * 3;
      startDate = new Date(currentYear, quarterStartMonth, 1);
      endDate = new Date(currentYear, quarterStartMonth + 3, 0);
    } else {
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31);
    }

    // Single optimized query to get all leads with owner info
    const leads = await prisma.lead.findMany({
      where: {
        // Filter by user access
        ...(isAdmin ? {} : { ownerId: session.user.id }),
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        projectValue: true,
        projectType: true,
        currency: true,
        email: true,
        phone: true,
        designation: true,
        department: true,
        company: true,
        website: true,
        status: true,
        source: true,
        createdAt: true,
        updatedAt: true,
        industry: true,
        tags: true,
        isActive: true,
        timeline: true,
        middleName: true,
        lastName: true,
        country: true,
        photo: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: [
        { createdAt: "desc" }
      ]
    });

    // Single optimized query to get targets for the current period
    const targets = await prisma.target.findMany({
      where: {
        period: "MONTHLY",
        targetType: "USER",
        year: currentYear,
        month: currentMonth,
        ...(isAdmin ? {} : { userId: session.user.id })
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

    // Calculate target amount (sum of user targets for the period)
    let targetAmount = 0;
    if (targets.length > 0) {
      targetAmount = targets.reduce((sum, target) => {
        return sum + parseFloat(target.amount.toString());
      }, 0);
    }

    // Process pipeline metrics in memory (much faster than multiple DB queries)
    const pipelineMetrics = {
      totalPipelineValue: 0,
      expectedRevenue: 0,
      dealsInPipeline: 0,
      wonDeals: 0,
      lostDeals: 0,
      conversionRate: 0,
      avgDealSize: 0,
      avgSalesCycle: 30,
      forecastVsTarget: 0,
      target: targetAmount
    };

    // Calculate metrics from leads data
    const activeLeads = leads.filter(lead => lead.isActive !== false);
    const wonLeads = leads.filter(lead => lead.status === "WON");
    const lostLeads = leads.filter(lead => lead.status === "LOST");

    // Calculate pipeline value (active leads only)
    pipelineMetrics.totalPipelineValue = activeLeads.reduce((sum, lead) => {
      const value = typeof lead.projectValue === 'number' ? lead.projectValue : parseFloat(lead.projectValue || '0');
      if (isNaN(value) || value === 0) return sum;
      const convertedValue = lead.currency === 'USD' ? value * 83 : value;
      return sum + convertedValue;
    }, 0);

    pipelineMetrics.expectedRevenue = pipelineMetrics.totalPipelineValue * 0.3;
    pipelineMetrics.dealsInPipeline = activeLeads.length;
    pipelineMetrics.wonDeals = wonLeads.length;
    pipelineMetrics.lostDeals = lostLeads.length;

    const totalDeals = wonLeads.length + lostLeads.length;
    pipelineMetrics.conversionRate = totalDeals > 0 ? (wonLeads.length / totalDeals) * 100 : 0;
    pipelineMetrics.avgDealSize = pipelineMetrics.dealsInPipeline > 0 ? pipelineMetrics.totalPipelineValue / pipelineMetrics.dealsInPipeline : 0;
    pipelineMetrics.forecastVsTarget = pipelineMetrics.expectedRevenue;

    // Calculate stage summaries
    const PIPELINE_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'];
    const stageSummaries = PIPELINE_STAGES.map((stage) => {
      const leadsInStage = leads.filter((lead) => lead.status === stage);
      const totalValue = leadsInStage.reduce((sum, lead) => {
        const rawValue = typeof lead.projectValue === 'number' ? lead.projectValue : parseFloat(lead.projectValue || '0');
        if (isNaN(rawValue) || rawValue === 0) return sum;
        const convertedValue = lead.currency === 'USD' ? rawValue * 83 : rawValue;
        return sum + convertedValue;
      }, 0);

      return {
        stage,
        count: leadsInStage.length,
        value: totalValue
      };
    });

    // Calculate leads by source
    const leadsBySourceMap = leads.reduce((acc, lead) => {
      const sourceKey = lead.source?.trim() || 'Unknown';
      const rawValue = typeof lead.projectValue === 'number' ? lead.projectValue : parseFloat(lead.projectValue || '0');
      const numericValue = Number.isFinite(rawValue) ? rawValue : 0;
      const revenueInInr = lead.currency === 'USD' ? numericValue * 83 : numericValue;

      if (!acc[sourceKey]) {
        acc[sourceKey] = { source: sourceKey, count: 0, revenue: 0 };
      }

      acc[sourceKey].count += 1;
      acc[sourceKey].revenue += revenueInInr;

      return acc;
    }, {} as Record<string, { source: string; count: number; revenue: number }>);

    const leadsBySourceSummary = Object.values(leadsBySourceMap).sort((a, b) => {
      if (b.revenue === a.revenue) {
        return b.count - a.count;
      }
      return b.revenue - a.revenue;
    });

    // Calculate pipeline aging
    const nowTs = Date.now();
    const dayMs = 1000 * 60 * 60 * 24;
    const bucketDefinitions = [
      { id: '0-30', label: '0-30 days', min: 0, max: 30, color: 'bg-green-500' },
      { id: '31-60', label: '31-60 days', min: 31, max: 60, color: 'bg-yellow-500' },
      { id: '61-90', label: '61-90 days', min: 61, max: 90, color: 'bg-orange-500' },
      { id: '90+', label: '90+ days', min: 91, max: Number.POSITIVE_INFINITY, color: 'bg-red-500' }
    ];

    const bucketStats = bucketDefinitions.map((bucket) => ({
      ...bucket,
      deals: 0,
      value: 0
    }));

    activeLeads.forEach((lead) => {
      const createdTs = Date.parse(lead.createdAt.toString());
      const ageDays = Number.isFinite(createdTs) ? Math.max(0, Math.floor((nowTs - createdTs) / dayMs)) : 0;
      const bucketIndex = bucketStats.findIndex((bucket) => ageDays >= bucket.min && ageDays <= bucket.max);
      const bucket = bucketIndex >= 0 ? bucketStats[bucketIndex] : bucketStats[bucketStats.length - 1];

      bucket.deals += 1;

      const rawValue = typeof lead.projectValue === 'number' ? lead.projectValue : parseFloat(lead.projectValue || '0');
      if (Number.isFinite(rawValue) && rawValue !== 0) {
        const converted = lead.currency === 'USD' ? rawValue * 83 : rawValue;
        bucket.value += converted;
      }
    });

    const pipelineAgingBuckets = bucketStats.map((bucket) => ({
      id: bucket.id,
      label: bucket.label,
      color: bucket.color,
      deals: bucket.deals,
      value: bucket.value,
      percentage: pipelineMetrics.dealsInPipeline > 0 ? Math.round((bucket.deals / pipelineMetrics.dealsInPipeline) * 100) : 0
    }));

    return NextResponse.json({
      leads,
      pipelineMetrics,
      stageSummaries,
      leadsBySourceSummary,
      pipelineAgingBuckets,
      targetAmount,
      timeRange: {
        type: timeRange,
        year: currentYear,
        month: currentMonth,
        quarter: currentQuarter,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error("Pipeline API error:", error);
    return NextResponse.json({ 
      error: "Failed to load pipeline data",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
