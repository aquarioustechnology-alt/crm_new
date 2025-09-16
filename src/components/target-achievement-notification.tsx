"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle, Target, X, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

type Achievement = {
  id: string;
  type: "TARGET_ACHIEVED" | "MILESTONE_REACHED" | "TARGET_EXCEEDED";
  title: string;
  message: string;
  value: number;
  target: number;
  percentage: number;
  timestamp: Date;
};

export function TargetAchievementNotification() {
  const { status } = useSession();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [visibleAchievements, setVisibleAchievements] = useState<Achievement[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const hasLoggedRef = useRef(false);

  // Check for new achievements
  const checkAchievements = async () => {
    // Only run when authenticated and browser is online
    if (status !== "authenticated" || typeof window === "undefined" || !navigator.onLine) return;
    try {
      // Abort any in-flight request before starting a new one
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch("/api/targets/progress?period=MONTHLY", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (response.ok) {
        const data = await response.json();
        const newAchievements: Achievement[] = [];

        data.progress.forEach((progressItem: any) => {
          const percentage = progressItem.progressPercentage;
          const achievementKey = `${progressItem.target.id}-${progressItem.period.type}-${progressItem.period.year}-${progressItem.period.month || progressItem.period.quarter || ''}`;
          
          // Check if we've already shown this achievement
          const storedAchievements = JSON.parse(localStorage.getItem("shownAchievements") || "[]");
          
          if (progressItem.isAchieved && !storedAchievements.includes(achievementKey)) {
            newAchievements.push({
              id: achievementKey,
              type: percentage > 100 ? "TARGET_EXCEEDED" : "TARGET_ACHIEVED",
              title: percentage > 100 ? "🎉 Target Exceeded!" : "🎯 Target Achieved!",
              message: `${progressItem.target.targetType === "COMPANY" ? "Company" : "Your"} ${progressItem.target.period.toLowerCase()} target has been ${percentage > 100 ? "exceeded" : "achieved"}!`,
              value: progressItem.achievedAmount,
              target: progressItem.targetAmount,
              percentage: percentage,
              timestamp: new Date(),
            });
            
            // Mark as shown
            storedAchievements.push(achievementKey);
            localStorage.setItem("shownAchievements", JSON.stringify(storedAchievements));
          } else if (percentage >= 75 && percentage < 100 && !storedAchievements.includes(`${achievementKey}-milestone-75`)) {
            newAchievements.push({
              id: `${achievementKey}-milestone-75`,
              type: "MILESTONE_REACHED",
              title: "🌟 Great Progress!",
              message: `You're ${Math.round(percentage)}% of the way to your ${progressItem.target.period.toLowerCase()} target!`,
              value: progressItem.achievedAmount,
              target: progressItem.targetAmount,
              percentage: percentage,
              timestamp: new Date(),
            });
            
            storedAchievements.push(`${achievementKey}-milestone-75`);
            localStorage.setItem("shownAchievements", JSON.stringify(storedAchievements));
          }
        });

        if (newAchievements.length > 0) {
          setAchievements(prev => [...prev, ...newAchievements]);
          setVisibleAchievements(prev => [...prev, ...newAchievements]);
        }
      }
    } catch (error: any) {
      // Swallow fetch/network abort errors quietly to prevent noisy console
      if (error?.name === "AbortError") return;
      if (!hasLoggedRef.current) {
        // Log once per session to avoid spam
        console.debug("Achievement check skipped:", error?.message || error);
        hasLoggedRef.current = true;
      }
    }
  };

  // Check achievements on mount/status change and then every 5 minutes
  useEffect(() => {
    if (status === "authenticated") {
      checkAchievements();
      const interval = setInterval(checkAchievements, 5 * 60 * 1000); // 5 minutes
      return () => {
        clearInterval(interval);
        abortRef.current?.abort();
      };
    }
  }, [status]);

  // Auto-hide achievements after 10 seconds
  useEffect(() => {
    visibleAchievements.forEach((achievement) => {
      setTimeout(() => {
        setVisibleAchievements(prev => prev.filter(a => a.id !== achievement.id));
      }, 10000);
    });
  }, [visibleAchievements]);

  const dismissAchievement = (achievementId: string) => {
    setVisibleAchievements(prev => prev.filter(a => a.id !== achievementId));
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getIcon = (type: Achievement["type"]) => {
    switch (type) {
      case "TARGET_ACHIEVED":
        return <Target className="w-6 h-6 text-green-400" />;
      case "TARGET_EXCEEDED":
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case "MILESTONE_REACHED":
        return <Star className="w-6 h-6 text-blue-400" />;
      default:
        return <CheckCircle className="w-6 h-6 text-green-400" />;
    }
  };

  const getColors = (type: Achievement["type"]) => {
    switch (type) {
      case "TARGET_ACHIEVED":
        return "from-green-900/90 to-green-800/90 border-green-500/50";
      case "TARGET_EXCEEDED":
        return "from-yellow-900/90 to-yellow-800/90 border-yellow-500/50";
      case "MILESTONE_REACHED":
        return "from-blue-900/90 to-blue-800/90 border-blue-500/50";
      default:
        return "from-green-900/90 to-green-800/90 border-green-500/50";
    }
  };

  if (visibleAchievements.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4 max-w-sm">
      {visibleAchievements.map((achievement) => (
        <div
          key={achievement.id}
          className={`bg-gradient-to-r ${getColors(achievement.type)} backdrop-blur-sm rounded-xl p-4 border shadow-xl animate-in slide-in-from-right-full duration-500`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(achievement.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-sm mb-1">
                {achievement.title}
              </h4>
              <p className="text-white/90 text-xs mb-3">
                {achievement.message}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/80">Progress</span>
                  <span className="text-white font-medium">{Math.round(achievement.percentage)}%</span>
                </div>
                
                <div className="w-full bg-black/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-500"
                    style={{ width: `${Math.min(achievement.percentage, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-white/80">
                  <span>Achieved: {formatCurrency(achievement.value)}</span>
                  <span>Target: {formatCurrency(achievement.target)}</span>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissAchievement(achievement.id)}
              className="flex-shrink-0 h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
