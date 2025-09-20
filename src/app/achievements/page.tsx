"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Target, TrendingUp, Calendar, Filter, Users } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import AppShell from "@/components/app-shell";
import dynamic from "next/dynamic";

// Lazy load heavy components
const AchievementsTable = dynamic(() => import("@/components/achievements-table").then(mod => ({ default: mod.AchievementsTable })), {
  loading: () => (
    <div className="text-center py-8">
      <div className="w-6 h-6 animate-spin border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-slate-400">Loading table...</p>
    </div>
  ),
  ssr: false,
});

interface Achievement {
  id: string;
  targetType: "COMPANY" | "USER";
  period: "MONTHLY" | "QUARTERLY" | "YEARLY";
  periodDisplay: string;
  year: number;
  targetAmount: number;
  achievedAmount: number;
  achievementPercentage: number;
  isAchieved: boolean;
  status: "ACHIEVED" | "NOT_ACHIEVED";
  currency: string;
  dealsCount: number;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface AchievementSummary {
  totalTargets: number;
  achievedTargets: number;
  failedTargets: number;
  achievementRate: number;
  totalTargetAmount: number;
  totalAchievedAmount: number;
  amountPercentage: number;
  totalDeals: number;
}

interface AchievementsData {
  achievements: Achievement[];
  summary: AchievementSummary;
  meta: {
    isAdmin: boolean;
    userId: string;
    filters: {
      year?: string;
      period?: string;
      user?: string;
    };
  };
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function AchievementsPage() {
  const currentYear = new Date().getFullYear();
  const currentYearString = currentYear.toString();
  const recentYears = Array.from({ length: 6 }, (_, index) => currentYear - index);
  const { data: session } = useSession();
  const [data, setData] = useState<AchievementsData | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: currentYearString,
    period: "ALL",
    userId: "ALL"
  });

  const isAdmin = session?.user?.role === "ADMIN";

  // Fetch users for admin dropdown
  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let isMounted = true;

    const loadUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          return;
        }

        const userData = await response.json();
        const normalizedUsers = Array.isArray(userData)
          ? userData
          : userData?.users ?? [];

        if (isMounted) {
          setUsers(normalizedUsers as UserOption[]);
        }
      } catch {
        if (isMounted) {
          setUsers([]);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  // Fetch achievements data
  useEffect(() => {
    fetchAchievements();
  }, [filters]);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.year) params.append("year", filters.year);
      if (filters.period) params.append("period", filters.period);
      if (filters.userId) params.append("userId", filters.userId);

      console.log('Fetching achievements with params:', params.toString());
      const response = await fetch(`/api/achievements?${params.toString()}`);
      
      if (response.ok) {
        const achievementsData = await response.json();
        console.log('Achievements data received:', achievementsData);
        setData(achievementsData);
      } else {
        console.error('Failed to fetch achievements:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      year: currentYearString,
      period: "ALL",
      userId: "ALL"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading achievements...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const achievements = data?.achievements || [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Achievements</h1>
              <p className="text-slate-400">
                {isAdmin 
                  ? "Track performance across all team members and company targets. Use filters to focus on specific users or company-wide performance."
                  : "View your personal achievement history and company performance"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Year Filter */}
              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                <Select value={filters.year} onValueChange={(value) => handleFilterChange("year", value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {recentYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Period Filter */}
              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-slate-300 mb-2">Period</label>
                <Select value={filters.period} onValueChange={(value) => handleFilterChange("period", value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="All periods" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="ALL">All Periods</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Type Filter - Admin Only */}
              {isAdmin && (
                <div className="min-w-[200px]">
                  <label className="block text-sm font-medium text-slate-300 mb-2">View</label>
                  <Select value={filters.userId} onValueChange={(value) => handleFilterChange("userId", value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="ALL">📊 All Users & Company</SelectItem>
                      <SelectItem value="COMPANY">🏢 Company Targets Only</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          👤 {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="border-slate-600 hover:bg-slate-700"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Total Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalTargets}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {summary.achievedTargets} achieved, {summary.failedTargets} missed
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Achievement Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.achievementRate}%</div>
                <div className="text-xs text-slate-400 mt-1">
                  Success rate across all targets
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Amount Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.amountPercentage}%</div>
                <div className="text-xs text-slate-400 mt-1">
                  {formatCurrency(summary.totalAchievedAmount)} of {formatCurrency(summary.totalTargetAmount)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalDeals}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Won deals contributing to targets
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Achievements Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Achievement History</h2>
              <p className="text-sm text-slate-400">
                {achievements.length > 0 
                  ? `Showing ${achievements.length} target${achievements.length === 1 ? '' : 's'} ${filters.userId === 'COMPANY' ? '(Company targets only)' : filters.userId !== 'ALL' ? '(Filtered view)' : '(All targets)'}`
                  : "No achievements found for the selected filters. Try adjusting the year, period, or view settings."
                }
              </p>
            </div>
          </div>
          <AchievementsTable 
            achievements={achievements} 
            isAdmin={isAdmin}
            loading={loading}
          />
        </div>
      </div>
    </AppShell>
  );
}
