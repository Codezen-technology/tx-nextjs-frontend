import { cn } from "@/lib/utils/cn";

/** Maps common B2B status strings to a rounded-full pill with semantic colors. */
const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  completed: "bg-[#3F576F]/10 text-[#3F576F]",
  enrolled: "bg-[#3F576F]/10 text-[#3F576F]",
  inactive: "bg-neutral-100 text-neutral-500",
  expired: "bg-amber-50 text-amber-700",
  revoked: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-700",
  available: "bg-emerald-50 text-emerald-700",
  manager: "bg-[#F9A31A]/15 text-[#B9760A]",
  learner: "bg-neutral-100 text-neutral-600",
};

export function StatusBadge({ status, className }: { status?: string; className?: string }) {
  const key = (status ?? "").toLowerCase();
  const style = STATUS_STYLES[key] ?? "bg-neutral-100 text-neutral-600";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        style,
        className,
      )}
    >
      {status || "—"}
    </span>
  );
}
