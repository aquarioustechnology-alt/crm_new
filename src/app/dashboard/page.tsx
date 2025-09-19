"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Award, 
  Clock,
  ArrowRight,
  BarChart3,
  Users,
  CheckCircle,
  AlertCircle,
  Plus
} from "lucide-react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type TargetProgress = {
  target: {
    id: string;
    amount: string;
    currency: string;
    period: string;
    year: number;
    month?: number;
    quarter?: number;
    targetType: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  };
  achievedAmount: number;
  targetAmount: number;
  progressPercentage: number;
  remainingAmount: number;
  dealsCount: number;
  isAchieved: boolean;
  period: {
    type: string;
    year: number;
    month?: number;
    quarter?: number;
  };
};

type ProgressSummary = {
  totalTargets: number;
  achievedTargets: number;
  totalTargetAmount: number;
  totalAchievedAmount: number;
  totalDeals: number;
  overallProgress: number;
};

type DashboardData = {
  progress: TargetProgress[];
  summary: ProgressSummary;
  period: {
    type: string;
    year: number;
    month?: number;
    quarter?: number;
  };
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("MONTHLY");
  const [isLoading, setIsLoading] = useState(true);

  // Admin view mode and user selection
  const [viewMode, setViewMode] = useState<'COMPANY' | 'USER'>("COMPANY");
  const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ period: selectedPeriod });
      if (isAdmin && viewMode === 'USER' && selectedUserId) {
        params.set('userId', selectedUserId);
      }
      const response = await fetch(`/api/targets/progress?${params.toString()}`, {
        headers: {
          'Cache-Control': 'max-age=60'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod, isAdmin, viewMode, selectedUserId]);

  useEffect(() => {
    if (session?.user) {
      loadDashboardData();
    }
  }, [session?.user, loadDashboardData]);

  const formatCurrency = useCallback((amount: number, currency: string) => {
    const symbol = currency === "USD" ? "$" : "₹";
    return `${symbol}${amount.toLocaleString()}`;
  }, []);

  const formatPeriodDisplay = useCallback((target: TargetProgress["target"]) => {
    if (target.period === "MONTHLY") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[(target.month || 1) - 1]} ${target.year}`;
    } else if (target.period === "QUARTERLY") {
      return `Q${target.quarter} ${target.year}`;
    } else {
      return target.year.toString();
    }
  }, []);

  const currentPeriodName = useMemo(() => {
    const now = new Date();
    if (selectedPeriod === "MONTHLY") {
      return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (selectedPeriod === "QUARTERLY") {
      const quarter = Math.ceil((now.getMonth() + 1) / 3);
      return `Q${quarter} ${now.getFullYear()}`;
    } else {
      return now.getFullYear().toString();
    }
  }, [selectedPeriod]);

  // Load users when admin switches to USER view (must be before any early return)
  useEffect(() => {
    const loadUsers = async () => {
      if (!isAdmin || viewMode !== 'USER' || users.length > 0) return;
      try {
        setIsLoadingUsers(true);
        const res = await fetch('/api/users?isActive=true');
        if (res.ok) {
          const data = await res.json();
          const simplified = (Array.isArray(data) ? data : []).map((u: any) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName }));
          setUsers(simplified);
        }
      } catch (e) {
        console.error('Failed to load users', e);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, [isAdmin, viewMode, users.length]);

  if (!session?.user) {
    return null;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {session.user.firstName}! 👋
            </h1>
            <p className="text-slate-400 mt-1">
              Here's your performance overview for {currentPeriodName}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Period Selector */}
            <div className="flex bg-slate-800 rounded-full p-1 overflow-hidden">
              {["MONTHLY", "QUARTERLY", "YEARLY"].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                    selectedPeriod === period
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {period.toLowerCase()}
                </button>
              ))}
            </div>

            {/* Admin View Mode */}
            {isAdmin && (
              <div className="flex items-center gap-2 bg-slate-800 rounded-full p-1 overflow-hidden">
                {(['COMPANY','USER'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                      viewMode === mode
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {mode === 'COMPANY' ? 'company' : 'user'}
                  </button>
                ))}
                {viewMode === 'USER' && (
                  <div className="min-w-[180px]">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9">
                        <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select user"} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.firstName} {u.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
            
            <Link href="/leads/new">
              <Button className="bg-purple-600 hover:bg-purple-700 rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {dashboardData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Overall Progress */}
                <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-xl p-6 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-purple-200 text-sm font-medium">Overall Progress</p>
                      <p className="text-2xl font-bold text-white">
                        {dashboardData.summary.overallProgress}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(dashboardData.summary.overallProgress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Total Achievement */}
                <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-xl p-6 border border-green-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-green-200 text-sm font-medium">Achievement</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(dashboardData.summary.totalAchievedAmount, "INR")}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                  <p className="text-green-300 text-sm">
                    of {formatCurrency(dashboardData.summary.totalTargetAmount, "INR")} target
                  </p>
                </div>

                {/* Active Targets */}
                <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-xl p-6 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-blue-200 text-sm font-medium">Active Targets</p>
                      <p className="text-2xl font-bold text-white">
                        {dashboardData.summary.totalTargets}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                  <p className="text-blue-300 text-sm">
                    {dashboardData.summary.achievedTargets} achieved
                  </p>
                </div>

                {/* Won Deals */}
                <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/50 rounded-xl p-6 border border-orange-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-orange-200 text-sm font-medium">Won Deals</p>
                      <p className="text-2xl font-bold text-white">
                        {dashboardData.summary.totalDeals}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                  <p className="text-orange-300 text-sm">
                    this {selectedPeriod.toLowerCase().slice(0, -2)}
                  </p>
                </div>
              </div>
            )}

            {/* Individual Targets */}
            {dashboardData && dashboardData.progress.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl border border-slate-600/50 overflow-hidden">
                <div className="p-6 border-b border-slate-600/50 rounded-t-xl">
                  <h2 className="text-xl font-semibold text-white mb-2">Your Targets</h2>
                  <p className="text-slate-400">Track your progress across all assigned targets</p>
                </div>

                <div className="p-6 space-y-4">
                  {dashboardData.progress.map((item) => (
                    <div 
                      key={item.target.id} 
                      className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            item.isAchieved ? "bg-green-400" : 
                            item.progressPercentage >= 75 ? "bg-yellow-400" : "bg-blue-400"
                          }`}></div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                item.target.targetType === "COMPANY" 
                                  ? "bg-purple-500/20 text-purple-300" 
                                  : "bg-blue-500/20 text-blue-300"
                              }`}>
                                {item.target.targetType}
                              </span>
                              <span className="text-sm text-slate-300">
                                {formatPeriodDisplay(item.target)}
                              </span>
                            </div>
                            {item.target.targetType === "USER" && item.target.user && (
                              <p className="text-xs text-slate-400 mt-1">
                                Assigned to: {item.target.user.firstName} {item.target.user.lastName}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-semibold text-white">
                            {formatCurrency(item.achievedAmount, item.target.currency)}
                          </p>
                          <p className="text-sm text-slate-400">
                            of {formatCurrency(item.targetAmount, item.target.currency)}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-400">{item.progressPercentage}% Complete</span>
                          <span className="text-slate-400">{item.dealsCount} deals</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              item.isAchieved ? "bg-gradient-to-r from-green-500 to-green-400" :
                              item.progressPercentage >= 75 ? "bg-gradient-to-r from-yellow-500 to-yellow-400" :
                              "bg-gradient-to-r from-blue-500 to-blue-400"
                            }`}
                            style={{ width: `${Math.min(item.progressPercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {item.isAchieved ? (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Target Achieved!</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">
                              {formatCurrency(item.remainingAmount, item.target.currency)} remaining
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/leads" className="block">
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50 hover:border-slate-500/50 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">View All Leads</h3>
                      <p className="text-slate-400 text-sm">Manage your lead pipeline</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </Link>

              <Link href="/pipeline" className="block">
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50 hover:border-slate-500/50 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Pipeline View</h3>
                      <p className="text-slate-400 text-sm">Track deals through stages</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </Link>

              {isAdmin && (
                <Link href="/admin/targets" className="block">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50 hover:border-slate-500/50 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Manage Targets</h3>
                        <p className="text-slate-400 text-sm">Set and track team goals</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
              )}
            </div>

            {/* No Targets State */}
            {dashboardData && dashboardData.progress.length === 0 && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl border border-slate-600/50 p-12 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                <h3 className="text-xl font-semibold text-white mb-2">No Targets Set</h3>
                <p className="text-slate-400 mb-6">
                  {isAdmin 
                    ? "Start by setting up targets for your team and yourself."
                    : "Your admin will set targets for you soon."
                  }
                </p>
                {isAdmin && (
                  <Link href="/admin/targets">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Targets
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
