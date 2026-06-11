"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDuration } from "@/lib/utils/format";
import { PlayerItemType, type IPlayerUnit } from "@/types/player";

interface PlayerUnitItemProps {
  unit: IPlayerUnit;
  courseId: number;
  isActive: boolean;
  isMarkingComplete: boolean;
  onCompleteUnit: (unitId: number) => void;
}

export function PlayerUnitItem({
  unit,
  courseId,
  isActive,
  isMarkingComplete,
  onCompleteUnit,
}: PlayerUnitItemProps) {
  const router = useRouter();
  const done = unit.status >= 1;
  const isQuiz = unit.type === PlayerItemType.Quiz;
  const canMarkComplete = !isQuiz && !done;

  const handleSelect = () => {
    router.push(`/learn/${courseId}/${unit.id}`);
  };

  const handleComplete = (e: React.MouseEvent) => {
    if (!canMarkComplete || isMarkingComplete) return;
    e.stopPropagation();
    onCompleteUnit(unit.id);
  };

  return (
    <div
      id={`unit-${unit.id}`}
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={(e) => e.key === "Enter" && handleSelect()}
      className={cn(
        "flex cursor-pointer items-center border-l-2 p-4 text-gray-900 transition-colors",
        isActive ? "border-blue-600 bg-blue-50" : "border-transparent hover:bg-gray-50",
        done && !isActive && "opacity-75",
      )}
    >
      <div className="mr-3 shrink-0">
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-player-success" />
        ) : isMarkingComplete ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        ) : (
          <button
            type="button"
            onClick={handleComplete}
            title={canMarkComplete ? "Mark as complete" : undefined}
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border",
              isActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
              canMarkComplete && "hover:border-blue-600 hover:bg-blue-50",
              !canMarkComplete && "cursor-default",
            )}
            aria-label={canMarkComplete ? "Mark unit complete" : undefined}
          />
        )}
      </div>

      <div className="min-w-0 flex-grow overflow-hidden">
        <h4
          className={cn(
            "truncate text-sm text-gray-900",
            isActive && "font-semibold text-blue-900",
          )}
        >
          {unit.title}
        </h4>
        <div className="mt-1 flex items-center text-xs text-gray-600">
          {unit.icon ? <span className={cn(unit.icon, "mr-1")} /> : null}
          {unit.duration ? <span>{formatDuration(unit.duration)}</span> : null}
        </div>
      </div>
    </div>
  );
}
