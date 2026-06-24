import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface BusinessPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function BusinessPageHeader({
  title,
  description,
  actions,
  className,
}: BusinessPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-neutral-300">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
