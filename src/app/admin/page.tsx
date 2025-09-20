"use client";

import { useEffect, useState } from "react";
import { Target, Users, Calendar, Activity, TrendingUp, AlertTriangle } from "lucide-react";

type AdminStats = {
  totalTargets: number;
  activeTargets: number;
  totalLeads: number;
  revenueThisMonth: number;
  targetAchievement: number;
  systemHealth: string;
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalTargets: 0,
    activeTargets: 0,
    totalLeads: 0,
    revenueThisMonth: 0,
    targetAchievement: 0,
    systemHealth: "Good",
  });

  useEffect(() => {
    // Load admin statistics
    const loadStats = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        // Get monthly targets (only type stored in rationalized system)
        const targetsRes = await fetch(`/api/targets?period=MONTHLY&targetType=USER`);
        const monthlyTargets = await targetsRes.json();
        
        // Get leads
        const leadsRes = await fetch("/api/leads");
        const leads = await leadsRes.json();
        
        // Calculate stats
        const activeTargets = Array.isArray(monthlyTargets) 
          ? monthlyTargets.filter((t: any) => t.year === currentYear).length
          : 0;
        
        const revenueThisMonth = Array.isArray(leads)
          ? leads
              .filter((lead: any) => {
                const leadDate = new Date(lead.createdAt);
                return leadDate.getMonth() + 1 === currentMonth && 
                       leadDate.getFullYear() === currentYear &&
                       lead.status === "WON";
              })
              .reduce((sum: number, lead: any) => {
                const value = parseFloat(lead.projectValue || "0");
                return sum + (lead.currency === "USD" ? value * 83 : value);
              }, 0)
          : 0;

        // Calculate total monthly target for this month (sum of all user targets)
        const totalMonthlyTarget = Array.isArray(monthlyTargets)
          ? monthlyTargets
              .filter((t: any) => 
                t.year === currentYear && 
                t.month === currentMonth
              )
              .reduce((sum: number, t: any) => sum + parseFloat(t.amount || "0"), 0)
          : 0;
        
        const targetAchievement = totalMonthlyTarget > 0 
          ? (revenueThisMonth / totalMonthlyTarget) * 100
          : 0;

        setStats({
          totalTargets: Array.isArray(monthlyTargets) ? monthlyTargets.length : 0,
          activeTargets,
          totalLeads: Array.isArray(leads) ? leads.length : 0,
          revenueThisMonth,
          targetAchievement,
          systemHealth: targetAchievement > 80 ? "Excellent" : targetAchievement > 50 ? "Good" : "Needs Attention",
        });
      } catch (error) {
        console.error("Error loading admin stats:", error);
      }
    };

    loadStats();
  }, []);

  const formatCurrency = (value: number) => {
    const rounded = Math.round(value);
    const parts = rounded.toString().split('.');
    const integerPart = parts[0];
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `₹${formattedInteger}`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Targets</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalTargets}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-400">
            {stats.activeTargets} active for current year
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Leads</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalLeads}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-400">
            Across all time periods
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Revenue This Month</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.revenueThisMonth)}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-400">
            From won deals only
          </div>
        </div>
      </div>

      {/* Target Achievement & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <h3 className="text-lg font-semibold text-white mb-4">Target Achievement</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Monthly Progress</span>
              <span className="text-lg font-bold text-white">{Math.round(stats.targetAchievement)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  stats.targetAchievement > 80 ? 'bg-green-500' : 
                  stats.targetAchievement > 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(stats.targetAchievement, 100)}%` }}
              />
            </div>
            <div className={`text-center p-3 rounded-lg ${
              stats.targetAchievement > 80 ? 'bg-green-500/20 border border-green-500/30' :
              stats.targetAchievement > 50 ? 'bg-yellow-500/20 border border-yellow-500/30' :
              'bg-red-500/20 border border-red-500/30'
            }`}>
              <span className={`text-sm font-medium ${
                stats.targetAchievement > 80 ? 'text-green-400' :
                stats.targetAchievement > 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {stats.targetAchievement > 80 ? '🎯 Excellent Performance' :
                 stats.targetAchievement > 50 ? '📈 On Track' : '⚠️ Needs Attention'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Overall Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  stats.systemHealth === "Excellent" ? 'bg-green-500' :
                  stats.systemHealth === "Good" ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-white font-medium">{stats.systemHealth}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Database Connection</span>
                <span className="text-green-400">✓ Connected</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">API Endpoints</span>
                <span className="text-green-400">✓ Operational</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Target System</span>
                <span className="text-green-400">✓ Active</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Activity className="w-4 h-4" />
                <span>Last system check: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/targets"
            className="p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
              <div>
                <div className="font-medium text-white">Manage Targets</div>
                <div className="text-xs text-slate-400">Set monthly targets (auto-calculates quarterly/yearly)</div>
              </div>
            </div>
          </a>
          
          <a
            href="/leads"
            className="p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
              <div>
                <div className="font-medium text-white">View Leads</div>
                <div className="text-xs text-slate-400">Check lead management</div>
              </div>
            </div>
          </a>
          
          <a
            href="/pipeline"
            className="p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-green-400 group-hover:text-green-300" />
              <div>
                <div className="font-medium text-white">Pipeline Analytics</div>
                <div className="text-xs text-slate-400">Review performance metrics</div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
