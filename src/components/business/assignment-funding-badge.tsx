import { cn } from "@/lib/utils/cn";

const FUNDING_STYLES: Record<string, string> = {
  legacy: "bg-neutral-100 text-neutral-400",
  subscription: "bg-[#3F576F]/10 text-[#3F576F]",
  licence: "bg-emerald-50 text-emerald-700",
};

const FUNDING_LABELS: Record<string, string> = {
  credit: "Legacy",
  subscription: "Subscription",
  licence: "Licence",
};

export function AssignmentFundingBadge({
  assignmentType,
  className,
}: {
  assignmentType?: string;
  className?: string;
}) {
  const key = (assignmentType ?? "").toLowerCase();
  const label =
    key === "credit" ? FUNDING_LABELS.credit : (FUNDING_LABELS[key] ?? (assignmentType || "—"));
  const style =
    key === "credit"
      ? FUNDING_STYLES.legacy
      : (FUNDING_STYLES[key] ?? "bg-neutral-100 text-neutral-600");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        style,
        className,
      )}
    >
      {label}
    </span>
  );
}
