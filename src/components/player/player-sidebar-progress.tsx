"use client";

import { formatDuration } from "@/lib/utils/format";
import { getPlayableUnits } from "@/lib/player/progress";
import type { IPlayerCourse } from "@/types/player";

interface PlayerSidebarProgressProps {
  course: IPlayerCourse;
  progress: number;
}

export function PlayerSidebarProgress({ course, progress }: PlayerSidebarProgressProps) {
  const units = getPlayableUnits(course);
  const completed = units.filter((u) => u.status >= 1).length;
  const totalDuration = units.reduce((acc, u) => acc + (u.duration || 0), 0);

  return (
    <div className="mb-4 space-y-2">
      <div className="flex justify-between text-xs text-gray-600">
        <span>
          {completed}/{units.length} lectures
        </span>
        {totalDuration > 0 ? <span>{formatDuration(totalDuration)} total</span> : null}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="bg-player-success h-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{progress}% complete</p>
    </div>
  );
}
