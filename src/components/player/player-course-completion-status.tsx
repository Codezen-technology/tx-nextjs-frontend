"use client";

import { Loader2 } from "lucide-react";
import { useFinishCourse } from "@/lib/hooks/usePlayer";
import { getPlayableUnits } from "@/lib/player/progress";
import type { IPlayerCourse } from "@/types/player";

interface PlayerCourseCompletionStatusProps {
  course: IPlayerCourse;
  courseId: number;
}

export function PlayerCourseCompletionStatus({
  course,
  courseId,
}: PlayerCourseCompletionStatusProps) {
  const finish = useFinishCourse(courseId);
  const units = getPlayableUnits(course);
  const allDone = units.length > 0 && units.every((u) => u.status >= 1);
  const courseFinished = course.course_status === "3" || course.course_status === "4";

  if (!allDone || courseFinished) return null;

  return (
    <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
      <p className="mb-3 text-sm text-green-800">
        You have completed all units. Finish the course to receive your certificate.
      </p>
      <button
        type="button"
        onClick={() => finish.mutate()}
        disabled={finish.isPending}
        className="bg-player-success flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-60"
      >
        {finish.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Complete Course
      </button>
    </div>
  );
}
