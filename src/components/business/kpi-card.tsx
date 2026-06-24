import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Tailwind classes for the icon tint (text + bg). */
  tone?: "primary" | "amber" | "success" | "warning";
  hint?: string;
  className?: string;
}

const TONES: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  primary: "bg-[#3F576F]/10 text-[#3F576F]",
  amber: "bg-[#F9A31A]/15 text-[#B9760A]",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border border-neutral-30 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
          TONES[tone],
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-300">{label}</p>
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
        {hint ? <p className="truncate text-xs text-neutral-200">{hint}</p> : null}
      </div>
    </div>
  );
}
