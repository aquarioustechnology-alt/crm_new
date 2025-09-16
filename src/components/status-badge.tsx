import { cn } from "@/lib/utils";

export function StatusBadge({ value }: { value: string }) {
  const v = (value || "NEW").toUpperCase();
  const map: Record<string, string> = {
    NEW: "bg-primary/10 text-primary ring-1 ring-primary/30",
    CONTACTED: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
    QUALIFIED: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30",
    PROPOSAL: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
    WON: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
    LOST: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
  };
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium truncate max-w-20", map[v] ?? map.NEW)} title={v}>{v}</span>;
}
