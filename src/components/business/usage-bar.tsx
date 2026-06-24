import { cn } from "@/lib/utils/cn";

interface UsageBarProps {
  used: number;
  total: number;
  /** Override the fill color; defaults to threshold-based (green/amber/red). */
  color?: string;
  showLabel?: boolean;
  className?: string;
}

export function UsageBar({ used, total, color, showLabel = false, className }: UsageBarProps) {
  const safeTotal = total > 0 ? total : 0;
  const pct = safeTotal > 0 ? Math.min(100, Math.round((used / safeTotal) * 100)) : 0;

  const fill = color ?? (pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-[#F9A31A]" : "bg-emerald-500");

  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={cn("h-full rounded-full transition-all", fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? (
        <div className="mt-1 flex justify-between text-xs text-neutral-300">
          <span>Used: {used}</span>
          <span>{safeTotal > 0 ? `${pct}%` : "—"}</span>
        </div>
      ) : null}
    </div>
  );
}
