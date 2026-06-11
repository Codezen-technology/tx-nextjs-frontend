"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDuration } from "@/lib/utils/format";
import type { SectionStats } from "@/lib/player/sections";

interface PlayerSectionHeaderProps {
  title: string;
  stats: SectionStats;
  isExpanded: boolean;
  onClick: () => void;
}

export function PlayerSectionHeader({
  title,
  stats,
  isExpanded,
  onClick,
}: PlayerSectionHeaderProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100"
    >
      <div className="flex min-w-0 items-center gap-2">
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
        )}
        <span className="truncate text-sm font-medium text-gray-900">{title}</span>
      </div>
      <span className="shrink-0 text-xs text-gray-500">
        {stats.completedUnits}/{stats.totalUnits}
        {stats.totalDuration > 0 ? ` · ${formatDuration(stats.totalDuration)}` : ""}
      </span>
    </button>
  );
}
