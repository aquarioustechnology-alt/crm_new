"use client";

import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface AgingBadgeProps {
  statusChangedAt: string | Date;
  className?: string;
}

export function AgingBadge({ statusChangedAt, className = "" }: AgingBadgeProps) {
  // Calculate days since status change
  const calculateDays = (changedAt: string | Date): number => {
    const changeDate = new Date(changedAt);
    const now = new Date();
    const diffTime = now.getTime() - changeDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays); // Ensure non-negative
  };

  const days = calculateDays(statusChangedAt);

  // Determine badge color based on days
  const getBadgeVariant = (days: number): "default" | "secondary" | "destructive" | "outline" => {
    if (days <= 1) return "default"; // Green for fresh
    if (days <= 3) return "secondary"; // Blue for recent
    if (days <= 7) return "outline"; // Orange for getting old
    return "destructive"; // Red for old
  };

  const getBadgeColor = (days: number): string => {
    if (days <= 1) return "bg-green-500 hover:bg-green-600 text-white";
    if (days <= 3) return "bg-blue-500 hover:bg-blue-600 text-white";
    if (days <= 7) return "bg-orange-500 hover:bg-orange-600 text-white";
    return "bg-red-500 hover:bg-red-600 text-white";
  };

  const formatDays = (days: number): string => {
    if (days === 0) return "Today";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  return (
    <Badge 
      variant={getBadgeVariant(days)}
      className={`flex items-center gap-1 text-xs font-medium rounded-xl ${getBadgeColor(days)} ${className}`}
    >
      <Clock className="w-3 h-3" />
      {formatDays(days)}
    </Badge>
  );
}
