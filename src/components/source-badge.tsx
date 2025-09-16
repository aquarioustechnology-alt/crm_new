import { cn } from "@/lib/utils";

export function SourceBadge({ value }: { value: string }) {
  const v = (value || "OTHER").toUpperCase();
  const map: Record<string, string> = {
    WEBSITE: "bg-muted/50 text-muted-foreground ring-1 ring-border/50",
    LINKEDIN: "bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20",
    WHATSAPP: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20",
    REFERRAL: "bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/20",
    ADS: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20",
    IMPORT: "bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20",
    OTHER: "bg-muted/50 text-muted-foreground ring-1 ring-border/50",
  };
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs truncate max-w-20", map[v])} title={v}>{v}</span>;
}
