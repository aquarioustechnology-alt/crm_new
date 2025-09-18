"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Building, User, Calendar, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

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

interface AchievementsTableProps {
  achievements: Achievement[];
  isAdmin: boolean;
  loading?: boolean;
}

export function AchievementsTable({ achievements, isAdmin, loading }: AchievementsTableProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 animate-spin border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-400">Loading achievements...</p>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-slate-400 text-lg">No achievements found</p>
        <p className="text-slate-500 text-sm mt-1">
          Try adjusting your filters or check back later
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl overflow-hidden border border-slate-600/50 shadow-xl">
      <div className="overflow-x-hidden">
        <table className="w-full table-auto text-sm">
          <thead className="bg-slate-700/20">
            <tr>
              <th className="text-left px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20 rounded-tl-xl">Period</th>
              <th className="text-left px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20">Type</th>
              {isAdmin && (
                <th className="text-left px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20">User</th>
              )}
              <th className="text-right px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20">Target</th>
              <th className="text-right px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20">Achieved</th>
              <th className="text-center px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20">Progress</th>
              <th className="text-center px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20">Status</th>
              <th className="text-center px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20 rounded-tr-xl">Deals</th>
            </tr>
          </thead>
          <tbody>
          {achievements.map((achievement) => (
            <tr key={achievement.id} className="border-t border-slate-600/20 hover:bg-slate-700/10 transition-all duration-200 group">
              {/* Period */}
              <td className="px-4 py-5">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="font-semibold text-white text-sm">
                      {achievement.periodDisplay}
                    </div>
                    <div className="text-xs text-slate-400 capitalize">
                      {achievement.period.toLowerCase()}
                    </div>
                  </div>
                </div>
              </td>

              {/* Type */}
              <td className="px-4 py-5">
                <div className="flex items-center gap-2.5">
                  {achievement.targetType === "COMPANY" ? (
                    <>
                      <Building className="w-4 h-4 text-blue-400" />
                      <Badge variant="outline" className="border-blue-400/70 text-blue-400 bg-blue-400/10">
                        Company
                      </Badge>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 text-emerald-400" />
                      <Badge variant="outline" className="border-emerald-400/70 text-emerald-400 bg-emerald-400/10">
                        Personal
                      </Badge>
                    </>
                  )}
                </div>
              </td>

              {/* User - Admin Only */}
              {isAdmin && (
                <td className="px-4 py-5">
                  {achievement.user ? (
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-sm">
                        {achievement.user.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {achievement.user.email}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm font-medium">
                      All Users
                    </div>
                  )}
                </td>
              )}

              {/* Target Amount */}
              <td className="px-4 py-5 text-right">
                <div className="font-semibold text-white text-sm">
                  {formatCurrency(achievement.targetAmount, achievement.currency)}
                </div>
              </td>

              {/* Achieved Amount */}
              <td className="px-4 py-5 text-right">
                <div className="font-semibold text-emerald-400 text-sm">
                  {formatCurrency(achievement.achievedAmount, achievement.currency)}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {achievement.achievementPercentage}%
                </div>
              </td>

              {/* Progress */}
              <td className="px-4 py-5">
                <div className="w-24 mx-auto">
                  <Progress 
                    value={Math.min(achievement.achievementPercentage, 100)} 
                    className="h-2.5"
                  />
                  <div className="text-xs text-center text-slate-400 mt-1.5 font-medium">
                    {achievement.achievementPercentage}%
                  </div>
                </div>
              </td>

              {/* Status */}
              <td className="px-4 py-5 text-center">
                {achievement.isAchieved ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                      Achieved
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <Badge variant="destructive" className="shadow-sm">
                      Missed
                    </Badge>
                  </div>
                )}
              </td>

              {/* Deals Count */}
              <td className="px-4 py-5 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold text-white text-sm">
                    {achievement.dealsCount}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  deals
                </div>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
