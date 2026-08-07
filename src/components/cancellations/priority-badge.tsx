import { cn } from "@/lib/utils/cn";

interface PriorityBadgeProps {
  label?: string;
  className?: string;
}

export function PriorityBadge({ label = "High priority", className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "font-open-sans inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-green-800 uppercase",
        className,
      )}
    >
      {label}
    </span>
  );
}
