"use client";

import { X } from "lucide-react";
import { PlayerCourseCompletionStatus } from "@/components/player/player-course-completion-status";
import { PlayerSidebarProgress } from "@/components/player/player-sidebar-progress";
import { PlayerSidebarSections } from "@/components/player/player-sidebar-sections";
import { PLAYER_SIDEBAR_WIDTH } from "@/lib/player/constants";
import type { IPlayerCourse, IPlayerUnit } from "@/types/player";

interface PlayerSidebarShellProps {
  isOpen: boolean;
  onToggle: () => void;
  course: IPlayerCourse;
  courseId: number;
  items: IPlayerUnit[];
  activeUnitId: number;
  progress: number;
  onCompleteUnit: (unitId: number) => void;
  markingUnitId: number | null;
}

export function PlayerSidebarShell({
  isOpen,
  onToggle,
  course,
  courseId,
  items,
  activeUnitId,
  progress,
  onCompleteUnit,
  markingUnitId,
}: PlayerSidebarShellProps) {
  return (
    <div
      className={`hidden min-h-0 shrink-0 transform border-l border-gray-200 bg-white transition-all duration-300 ease-in-out lg:flex lg:flex-col ${
        isOpen ? "translate-x-0" : "w-0 translate-x-full overflow-hidden border-0"
      }`}
      style={isOpen ? { width: PLAYER_SIDEBAR_WIDTH } : undefined}
    >
      <div className="min-h-0 w-full flex-1 overflow-y-auto overscroll-y-contain p-4 text-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Course content</h2>
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <PlayerSidebarProgress course={course} progress={progress} />
        <PlayerCourseCompletionStatus course={course} courseId={courseId} />
        <PlayerSidebarSections
          items={items}
          courseId={courseId}
          activeUnitId={activeUnitId}
          onCompleteUnit={onCompleteUnit}
          markingUnitId={markingUnitId}
        />
      </div>
    </div>
  );
}
