"use client";

import AppShell from "@/components/app-shell";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Plus,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  BarChart3,
  Activity,
  MessageSquare,
  Edit3,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { CommentDialog } from "@/components/comment-dialog";
import { EditLeadModal } from "@/components/edit-lead-modal";

type LeadOwner = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

type Lead = {
  id: string;
  name: string;
  ownerId: string;
  owner?: LeadOwner | null;
  projectName?: string | null;
  projectValue?: number | string | null;
  projectType?: string | null;
  currency?: string | null;
  email?: string | null;
  phone?: string | null;
  designation?: string | null;
  department?: string | null;
  company?: string | null;
  website?: string | null;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  industry?: string | null;
  tags?: string[];
  isActive?: boolean;
  timeline?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  country?: string | null;
  photo?: string | null;
};

interface PipelineMetrics {
  totalPipelineValue: number;
  expectedRevenue: number;
  dealsInPipeline: number;
  wonDeals: number;
  lostDeals: number;
  conversionRate: number;
  avgDealSize: number;
  avgSalesCycle: number;
  forecastVsTarget: number;
  target: number;
}

const USD_TO_INR_RATE = 83;
const PIPELINE_STAGES = ['New Leads', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'] as const;

// Helper function to format currency with INR
const formatCurrency = (value: number) => {
  if (isNaN(value) || !isFinite(value)) return '₹0';
  const rounded = Math.round(value);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `₹${formatted}`;
};

function canManageLead(lead: Lead, currentUserId: string | null, isAdmin: boolean) {
  if (isAdmin) {
    return true;
  }
  if (!currentUserId) {
    return false;
  }
  return lead.ownerId === currentUserId;
}

// KPI Card Component
function KPICard({ title, value, subtitle, icon: Icon, color }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-xs font-medium">{title}</p>
          <p className="text-xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;
  const isAdmin = session?.user?.role === "ADMIN";

  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [targetAmount, setTargetAmount] = useState(0);
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string>("");

  const fetchIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canCurrentUserManageLead = (lead: Lead) => canManageLead(lead, currentUserId, isAdmin);

  // Load leads data
  async function loadLeads() {
    const fetchId = ++fetchIdRef.current;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsLoading(true);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const currentQuarter = Math.ceil(currentMonth / 3);

      const targetParams = new URLSearchParams();
      if (timeRange === 'month') {
        targetParams.set('period', 'MONTHLY');
        targetParams.set('year', currentYear.toString());
        targetParams.set('month', currentMonth.toString());
      } else if (timeRange === 'quarter') {
        targetParams.set('period', 'QUARTERLY');
        targetParams.set('year', currentYear.toString());
        targetParams.set('quarter', currentQuarter.toString());
      } else {
        targetParams.set('period', 'YEARLY');
        targetParams.set('year', currentYear.toString());
      }

      const leadsRequest = fetch("/api/leads", { cache: "no-store", signal: controller.signal });
      const targetRequest = fetch(`/api/targets/progress?${targetParams.toString()}`, {
        cache: "no-store",
        signal: controller.signal
      }).catch((targetError) => {
        if (targetError?.name !== 'AbortError') {
          console.warn("Could not load target data:", targetError);
        }
        return null;
      });

      const [leadsRes, targetRes] = await Promise.all([leadsRequest, targetRequest]);

      if (controller.signal.aborted || fetchId !== fetchIdRef.current) {
        return;
      }

      if (!leadsRes.ok) {
        throw new Error(`Failed to load leads (HTTP ${leadsRes.status})`);
      }

      const leadsData: Lead[] = await leadsRes.json();
      if (controller.signal.aborted || fetchId !== fetchIdRef.current) {
        return;
      }

      setAllLeads(Array.isArray(leadsData) ? leadsData : []);

      let nextTargetAmount = 0;
      if (targetRes && targetRes.ok) {
        const targetJson = await targetRes.json();
        nextTargetAmount = targetJson.summary?.totalTargetAmount || 0;
      }

      if (controller.signal.aborted || fetchId !== fetchIdRef.current) {
        return;
      }

      setTargetAmount(nextTargetAmount);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return;
      }
      console.error("Error loading pipeline data:", error);
    } finally {
      if (!controller.signal.aborted && fetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }

  const {
    totalLeadsCount,
    stageSummaries,
    maxStageCount,
    activeOpportunities,
    totalActiveLeadCount,
    leadsBySourceSummary,
    pipelineMetrics,
    pipelineAgingBuckets
  } = useMemo(() => {
    const totalLeadsCountLocal = allLeads.length;

    const stageSummariesLocal = PIPELINE_STAGES.map((stage) => {
      const leadsInStage = allLeads.filter((lead) => lead.status === stage.toUpperCase());
      const totalValue = leadsInStage.reduce((sum, lead) => {
        const rawValue = typeof lead.projectValue === 'number' ? lead.projectValue : parseFloat(lead.projectValue || '0');
        if (isNaN(rawValue) || rawValue === 0) return sum;
        const convertedValue = lead.currency === 'USD' ? rawValue * USD_TO_INR_RATE : rawValue;
        return sum + convertedValue;
      }, 0);

      return {
        stage,
        count: leadsInStage.length,
        value: totalValue
      };
    });

    const maxStageCountLocal = stageSummariesLocal.reduce((max, summary) => Math.max(max, summary.count), 0);

    const activeLeadList = allLeads.filter((lead) => lead.isActive !== false);
    const activeOpportunitiesLocal = activeLeadList.slice(0, 6);
    const totalActiveLeadCountLocal = activeLeadList.length;

    const leadsBySourceMap = allLeads.reduce((acc, lead) => {
      const sourceKey = lead.source?.trim() || 'Unknown';
      const rawValue =
        typeof lead.projectValue === 'number'
          ? lead.projectValue
          : lead.projectValue
          ? parseFloat(lead.projectValue)
          : 0;
      const numericValue = Number.isFinite(rawValue) ? rawValue : 0;
      const revenueInInr = lead.currency === 'USD' ? numericValue * USD_TO_INR_RATE : numericValue;

      if (!acc[sourceKey]) {
        acc[sourceKey] = { source: sourceKey, count: 0, revenue: 0 };
      }

      acc[sourceKey].count += 1;
      acc[sourceKey].revenue += revenueInInr;

      return acc;
    }, {} as Record<string, { source: string; count: number; revenue: number }>);

    const leadsBySourceSummaryLocal = Object.values(leadsBySourceMap).sort((a, b) => {
      if (b.revenue === a.revenue) {
        return b.count - a.count;
      }
      return b.revenue - a.revenue;
    });

    const pipelineActiveLeads = allLeads.filter((lead) => !['WON', 'LOST'].includes(lead.status));
    const wonLeads = allLeads.filter((lead) => lead.status === 'WON');
    const lostLeads = allLeads.filter((lead) => lead.status === 'LOST');

    const totalPipelineValue = pipelineActiveLeads.reduce((sum, lead) => {
      const value = typeof lead.projectValue === 'number' ? lead.projectValue : parseFloat(lead.projectValue || '0');
      if (isNaN(value) || value === 0) return sum;
      const convertedValue = lead.currency === 'USD' ? value * USD_TO_INR_RATE : value;
      return sum + convertedValue;
    }, 0);

    const expectedRevenue = totalPipelineValue * 0.3;
    const avgDealSize = pipelineActiveLeads.length > 0 ? totalPipelineValue / pipelineActiveLeads.length : 0;
    const totalDeals = wonLeads.length + lostLeads.length;
    const conversionRate = totalDeals > 0 ? (wonLeads.length / totalDeals) * 100 : 0;

    const metrics: PipelineMetrics = {
      totalPipelineValue,
      expectedRevenue,
      dealsInPipeline: pipelineActiveLeads.length,
      wonDeals: wonLeads.length,
      lostDeals: lostLeads.length,
      conversionRate,
      avgDealSize,
      avgSalesCycle: 30,
      forecastVsTarget: expectedRevenue,
      target: targetAmount
    };

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

    pipelineActiveLeads.forEach((lead) => {
      const createdTs = Date.parse(lead.createdAt);
      const ageDays = Number.isFinite(createdTs) ? Math.max(0, Math.floor((nowTs - createdTs) / dayMs)) : 0;
      const bucketIndex = bucketStats.findIndex((bucket) => ageDays >= bucket.min && ageDays <= bucket.max);
      const bucket = bucketIndex >= 0 ? bucketStats[bucketIndex] : bucketStats[bucketStats.length - 1];

      bucket.deals += 1;

      const rawValue = typeof lead.projectValue === 'number' ? lead.projectValue : parseFloat(lead.projectValue || '0');
      if (Number.isFinite(rawValue) && rawValue !== 0) {
        const converted = lead.currency === 'USD' ? rawValue * USD_TO_INR_RATE : rawValue;
        bucket.value += converted;
      }
    });

    const pipelineAgingBuckets = bucketStats.map((bucket) => ({
      id: bucket.id,
      label: bucket.label,
      color: bucket.color,
      deals: bucket.deals,
      value: bucket.value,
      percentage:
        pipelineActiveLeads.length > 0
          ? Math.round((bucket.deals / pipelineActiveLeads.length) * 100)
          : 0
    }));

    return {
      totalLeadsCount: totalLeadsCountLocal,
      stageSummaries: stageSummariesLocal,
      maxStageCount: maxStageCountLocal,
      activeOpportunities: activeOpportunitiesLocal,
      totalActiveLeadCount: totalActiveLeadCountLocal,
      leadsBySourceSummary: leadsBySourceSummaryLocal,
      pipelineMetrics: metrics,
      pipelineAgingBuckets
    };
  }, [allLeads, targetAmount]);

  const hasTarget = Boolean(pipelineMetrics.target);
  const targetProgressRatio = hasTarget ? pipelineMetrics.expectedRevenue / pipelineMetrics.target : 0;
  const targetProgressPercentage = Math.round(targetProgressRatio * 100);
  const targetProgressWidth = Math.min(Math.max(targetProgressRatio * 100, 0), 100);
  const targetGapValue = hasTarget ? pipelineMetrics.expectedRevenue - pipelineMetrics.target : 0;
  const hasMetTarget = hasTarget && pipelineMetrics.expectedRevenue >= pipelineMetrics.target;
  const isApproachingTarget = hasTarget && pipelineMetrics.expectedRevenue >= pipelineMetrics.target * 0.8;
  const isOnTrackForTarget = hasTarget && pipelineMetrics.expectedRevenue >= pipelineMetrics.target * 0.9;

  useEffect(() => {
    loadLeads();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [timeRange]); // Reload when time range changes

  // Handle edit lead
  const handleEditLead = (lead: Lead) => {
    if (!canCurrentUserManageLead(lead)) {
      return;
    }
    setEditingLeadId(lead.id);
    setIsEditModalOpen(true);
  };

  // Handle lead updated
  const handleLeadUpdated = () => {
    loadLeads();
  };

  // Handle comment
  const handleComment = (lead: Lead) => {
    if (!canCurrentUserManageLead(lead)) {
      return;
    }
    setSelectedLead(lead);
    setCommentDialogOpen(true);
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading pipeline data...</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Pipeline Management</h1>
            <p className="text-slate-400 text-sm">Strategic pipeline analysis and forecasting</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800 rounded-full p-1">
              {(['month', 'quarter', 'year'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={`rounded-full ${
                    timeRange === range
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              className="rounded-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Link href="/leads/new">
              <Button className="bg-purple-600 hover:bg-purple-700 rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </Link>
          </div>
        </div>

        {/* Target Overview */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-6 mb-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Target Performance</h2>
              <p className="text-purple-200 text-sm">
                {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}ly target vs expected revenue
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                {targetProgressPercentage}%
              </p>
              <p className="text-purple-200 text-sm">of target</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-xs font-medium">TARGET AMOUNT</p>
              <p className="text-xl font-bold text-white">{formatCurrency(pipelineMetrics.target)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-xs font-medium">EXPECTED REVENUE</p>
              <p className="text-xl font-bold text-white">{formatCurrency(pipelineMetrics.expectedRevenue)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-xs font-medium">GAP TO TARGET</p>
              <p
                className={`text-xl font-bold ${
                  hasTarget
                    ? hasMetTarget
                      ? 'text-green-400'
                      : 'text-red-400'
                    : 'text-slate-400'
                }`}
              >
                {hasMetTarget ? '+' : ''}
                {formatCurrency(targetGapValue)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">Progress to Target</span>
              <span className="text-white font-medium">
                {targetProgressPercentage}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  hasMetTarget
                    ? 'bg-gradient-to-r from-green-500 to-green-400'
                    : isApproachingTarget
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                    : 'bg-gradient-to-r from-red-500 to-red-400'
                }`}
                style={{
                  width: `${targetProgressWidth}%`
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* KPI Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Pipeline Value"
            value={formatCurrency(pipelineMetrics.totalPipelineValue)}
            subtitle={`${timeRange} view`}
            icon={DollarSign}
            color="bg-blue-500/20"
          />
          <KPICard
            title="Expected Revenue"
            value={formatCurrency(pipelineMetrics.expectedRevenue)}
            subtitle="Probability-weighted"
            icon={Target}
            color="bg-green-500/20"
          />
          <KPICard
            title="Deals in Pipeline"
            value={pipelineMetrics.dealsInPipeline.toString()}
            subtitle="Active opportunities"
            icon={Users}
            color="bg-purple-500/20"
          />
          <KPICard
            title="Conversion Rate"
            value={`${pipelineMetrics.conversionRate.toFixed(1)}%`}
            subtitle={`${pipelineMetrics.wonDeals} won / ${pipelineMetrics.lostDeals} lost`}
            icon={TrendingUp}
            color="bg-orange-500/20"
          />
        </div>

        {/* Additional KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <KPICard
            title="Average Deal Size"
            value={formatCurrency(pipelineMetrics.avgDealSize)}
            subtitle="Per opportunity"
            icon={BarChart3}
            color="bg-cyan-500/20"
          />
          <KPICard
            title="Sales Cycle Length"
            value={`${Math.round(pipelineMetrics.avgSalesCycle)} days`}
            subtitle="Average time to close"
            icon={Clock}
            color="bg-yellow-500/20"
          />
          <KPICard
            title="Target Achievement"
            value={`${targetProgressPercentage}%`}
            subtitle="Forecast vs Target"
            icon={Activity}
            color="bg-red-500/20"
          />
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pipeline Funnel */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <h3 className="text-lg font-semibold text-white mb-4">Pipeline Funnel</h3>
          <div className="space-y-4">
            {stageSummaries.map((summary, index) => {
              const previousStageCount = index === 0 ? totalLeadsCount : stageSummaries[index - 1].count;
              const baselineCount = previousStageCount > 0 ? previousStageCount : totalLeadsCount;
              const widthPercent = maxStageCount > 0 ? (summary.count / maxStageCount) * 100 : 0;
              const dropOffPercent = baselineCount > 0 ? Math.max(((baselineCount - summary.count) / baselineCount) * 100, 0) : 0;
              const conversionPercent = baselineCount > 0 ? Math.min((summary.count / baselineCount) * 100, 100) : 0;

              return (
                <div key={summary.stage} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">{summary.stage}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{summary.count} deals</div>
                      <div className="text-xs text-slate-400">{formatCurrency(summary.value)}</div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>

                  {index < stageSummaries.length - 1 && (
                    <div className="text-xs text-red-400 mt-1">
                      ↓ {Math.round(dropOffPercent)}% drop-off
                    </div>
                  )}

                  <div className="text-xs text-slate-500 mt-1">
                    {Math.round(conversionPercent)}% conversion rate
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Forecast vs Target */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <h3 className="text-lg font-semibold text-white mb-4">Forecast vs Target</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Target</span>
              <span className="text-lg font-bold text-white">{formatCurrency(pipelineMetrics.target)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Expected Revenue</span>
              <span className="text-lg font-bold text-green-400">{formatCurrency(pipelineMetrics.expectedRevenue)}</span>
            </div>
            
            <div className="border-t border-slate-600 pt-4 rounded-b-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Gap</span>
                <span
                  className={`text-lg font-bold ${
                    hasTarget
                      ? pipelineMetrics.expectedRevenue >= pipelineMetrics.target
                        ? 'text-red-400'
                        : 'text-green-400'
                      : 'text-slate-400'
                  }`}
                >
                  {hasTarget && pipelineMetrics.expectedRevenue >= pipelineMetrics.target ? '+' : ''}
                  {formatCurrency(targetGapValue)}
                </span>
              </div>

              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{targetProgressPercentage}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isOnTrackForTarget ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${targetProgressWidth}%` }}
                  />
                </div>
              </div>
            </div>

            <div className={`text-center p-3 rounded-lg ${
              isOnTrackForTarget
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-red-500/20 border border-red-500/30'
            }`}>
              <span className={`text-sm font-medium ${isOnTrackForTarget ? 'text-green-400' : 'text-red-400'}`}>
                {isOnTrackForTarget ? '🎯 On Track' : '⚠️ Behind Target'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Aging */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <h3 className="text-lg font-semibold text-white mb-4">Pipeline Aging</h3>
          <div className="space-y-4">
            {pipelineAgingBuckets.map((bucket) => (
              <div key={bucket.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${bucket.color}`} />
                  <span className="text-sm text-slate-300">{bucket.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{bucket.deals} deals</div>
                  <div className="text-xs text-slate-400">{formatCurrency(bucket.value)}</div>
                </div>
                <div className="text-xs text-slate-500 w-12 text-right">
                  {bucket.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Deal Size Distribution */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <h3 className="text-lg font-semibold text-white mb-4">Deal Size Distribution</h3>
          <div className="space-y-4">
            {[
              { name: 'Small', color: 'bg-blue-500', maxValue: 100000 },
              { name: 'Medium', color: 'bg-purple-500', maxValue: 500000 },
              { name: 'Large', color: 'bg-green-500', maxValue: Infinity }
            ].map((size) => {
              const sizeLeads = allLeads.filter(lead => {
                if (!['WON', 'LOST'].includes(lead.status)) return false;
                const value = typeof lead.projectValue === 'number' ? lead.projectValue : parseFloat(lead.projectValue || '0');
                if (isNaN(value) || value === 0) return false;
                const convertedValue = lead.currency === "USD" ? value * 83 : value;
                return size.name === 'Small' ? convertedValue <= 100000 :
                       size.name === 'Medium' ? convertedValue > 100000 && convertedValue <= 500000 :
                       convertedValue > 500000;
              });
              
              const sizeValue = sizeLeads.reduce((sum, lead) => {
                const value = typeof lead.projectValue === 'number' ? lead.projectValue : parseFloat(lead.projectValue || '0');
                if (isNaN(value) || value === 0) return sum;
                const convertedValue = lead.currency === "USD" ? value * 83 : value;
                return sum + convertedValue;
              }, 0);
              
              return (
                <div key={size.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${size.color}`} />
                    <span className="text-sm text-slate-300">{size.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{sizeLeads.length} deals</div>
                    <div className="text-xs text-slate-400">Avg: {formatCurrency(sizeLeads.length > 0 ? sizeValue / sizeLeads.length : 0)}</div>
                  </div>
                  <div className="text-xs text-slate-500 w-16 text-right">
                    {formatCurrency(sizeValue)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Deals by Source */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <h3 className="text-lg font-semibold text-white mb-4">Deals by Source</h3>
          <div className="space-y-4">
            {leadsBySourceSummary.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No deals available to analyze</p>
            ) : (
              leadsBySourceSummary.map((summary) => (
                <div
                  key={summary.source}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm text-slate-300 truncate flex-1">{summary.source}</span>
                  <div className="text-right ml-4">
                    <div className="text-sm font-semibold text-white">
                      {summary.count} {summary.count === 1 ? "deal" : "deals"}
                    </div>
                    <div className="text-xs text-slate-400">{formatCurrency(summary.revenue)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Opportunities */}
      <div className="mt-8">
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Active Opportunities</h3>
              <p className="text-slate-400 text-sm">
                Quick access to the leads currently moving through your pipeline
              </p>
            </div>
            <div className="text-sm text-slate-500">
              Showing {activeOpportunities.length} of {totalActiveLeadCount} active leads
            </div>
          </div>

          <div className="space-y-3">
            {activeOpportunities.length > 0 ? (
              activeOpportunities.map((lead) => {
                const canManage = canCurrentUserManageLead(lead);
                const rawValue =
                  typeof lead.projectValue === "number"
                    ? lead.projectValue
                    : lead.projectValue
                    ? parseFloat(lead.projectValue)
                    : 0;
                const convertedValue = lead.currency === "USD" ? rawValue * USD_TO_INR_RATE : rawValue;
                const formattedValue =
                  Number.isNaN(convertedValue) || convertedValue === 0 ? null : formatCurrency(convertedValue);
                const ownerName = lead.owner
                  ? [lead.owner.firstName, lead.owner.lastName].filter(Boolean).join(" ").trim() || lead.owner.email || "Unknown owner"
                  : lead.ownerId === currentUserId
                  ? "You"
                  : "Team member";
                const statusLabel = lead.status
                  ? lead.status
                      .split("_")
                      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
                      .join(" ")
                  : "";
                const createdDate = new Date(lead.createdAt);
                const createdAtLabel = Number.isNaN(createdDate.getTime())
                  ? null
                  : createdDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const baseTooltip = "Only the lead owner or admins can manage this lead";

                return (
                  <div
                    key={lead.id}
                    className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-white font-semibold text-sm md:text-base truncate">
                            {lead.name}
                          </span>
                          {lead.company && (
                            <span className="text-xs text-slate-400 truncate">• {lead.company}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                          <span>Owner: {ownerName}</span>
                          {createdAtLabel && <span>Created {createdAtLabel}</span>}
                          {!canManage && !isAdmin && <span className="text-amber-400 font-medium">View only</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 md:flex-shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
                            {statusLabel}
                          </div>
                          {formattedValue && (
                            <div className="text-sm font-semibold text-emerald-400">{formattedValue}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canManage}
                            onClick={() => handleComment(lead)}
                            className={`h-8 w-8 p-0 rounded-md ${
                              canManage
                                ? "text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                                : "text-slate-500"
                            }`}
                            title={canManage ? "View and add comments" : baseTooltip}
                            aria-label={canManage ? "View and add comments" : baseTooltip}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canManage}
                            onClick={() => handleEditLead(lead)}
                            className={`h-8 w-8 p-0 rounded-md ${
                              canManage
                                ? "text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                                : "text-slate-500"
                            }`}
                            title={canManage ? "Edit lead" : baseTooltip}
                            aria-label={canManage ? "Edit lead" : baseTooltip}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 text-sm text-center py-8">
                No active opportunities available yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Comment Dialog */}
      {selectedLead && (
        <CommentDialog
          isOpen={commentDialogOpen}
          onClose={() => {
            setCommentDialogOpen(false);
            setSelectedLead(null);
          }}
          leadId={selectedLead.id}
          leadName={selectedLead.name}
        />
      )}

      {/* Edit Lead Modal */}
      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        leadId={editingLeadId}
        onLeadUpdated={handleLeadUpdated}
      />
    </AppShell>
  );
}
