import { cn } from "@/lib/utils/cn";

/** Maps common B2B status strings to a rounded-full pill with semantic colors. */
const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  completed: "bg-[#3F576F]/10 text-[#3F576F]",
  enrolled: "bg-[#3F576F]/10 text-[#3F576F]",
  in_progress: "bg-sky-50 text-sky-700",
  not_started: "bg-neutral-100 text-neutral-600",
  failed: "bg-red-50 text-red-700",
  inactive: "bg-neutral-100 text-neutral-500",
  archived: "bg-neutral-100 text-neutral-500",
  unassigned: "bg-neutral-100 text-neutral-600",
  expired: "bg-amber-50 text-amber-700",
  revoked: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  available: "bg-emerald-50 text-emerald-700",
  suspended: "bg-amber-50 text-amber-700",
  assigned: "bg-[#3F576F]/10 text-[#3F576F]",
  manager: "bg-[#F9A31A]/15 text-[#B9760A]",
  learner: "bg-neutral-100 text-neutral-600",
};

/**
 * Human labels for the statuses whose wire value is not presentable.
 * Without this, `capitalize` renders `in_progress` as "In_progress".
 */
const STATUS_LABELS: Record<string, string> = {
  in_progress: "In progress",
  not_started: "Not started",
  on_hold: "On hold",
  "on-hold": "On hold",
};

export function StatusBadge({ status, className }: { status?: string; className?: string }) {
  const key = (status ?? "").toLowerCase();
  const style = STATUS_STYLES[key] ?? "bg-neutral-100 text-neutral-600";
  const label = STATUS_LABELS[key] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        style,
        className,
      )}
    >
      {label || "—"}
    </span>
  );
}
