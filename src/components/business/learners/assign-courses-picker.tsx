"use client";

import { useMemo } from "react";
import { useBusinessLicenceBalance } from "@/lib/hooks/useBusinessDashboard";
import { formatPoolCourseName, poolAvailable } from "@/lib/utils/business-licences";
import { cn } from "@/lib/utils/cn";

interface AssignCoursesPickerProps {
  selected: number[];
  onChange: (courseIds: number[]) => void;
  disabled?: boolean;
}

/**
 * Courses a new learner can be enrolled on at creation time.
 *
 * Options come from the licence pools rather than the catalogue, because only
 * a course with a spare licence can actually be assigned. Universal pools
 * (`course_id: 0`) grant no specific course, so they are excluded.
 */
export function AssignCoursesPicker({ selected, onChange, disabled }: AssignCoursesPickerProps) {
  const { data, isLoading } = useBusinessLicenceBalance();

  const options = useMemo(() => {
    const byCourse = new Map<number, { courseId: number; name: string; available: number }>();

    for (const pool of data?.pools ?? []) {
      if (pool.course_id === 0) continue;

      const existing = byCourse.get(pool.course_id);
      const available = poolAvailable(pool);

      if (existing) {
        existing.available += available;
      } else {
        byCourse.set(pool.course_id, {
          courseId: pool.course_id,
          name: formatPoolCourseName(pool),
          available,
        });
      }
    }

    return [...byCourse.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [data?.pools]);

  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-lg bg-neutral-100" />;
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-neutral-300">
        No course licences available. Buy licences to assign courses while adding learners.
      </p>
    );
  }

  const toggle = (courseId: number) => {
    onChange(
      selected.includes(courseId)
        ? selected.filter((id) => id !== courseId)
        : [...selected, courseId],
    );
  };

  return (
    <ul className="border-neutral-30 max-h-56 space-y-1 overflow-y-auto rounded-lg border p-2">
      {options.map((option) => {
        const exhausted = option.available <= 0;
        const checked = selected.includes(option.courseId);

        return (
          <li key={option.courseId}>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                exhausted ? "cursor-not-allowed opacity-50" : "hover:bg-neutral-10",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled || exhausted}
                onChange={() => toggle(option.courseId)}
                className="h-4 w-4 accent-[#3F576F]"
              />
              <span className="flex-1 truncate text-neutral-900">{option.name}</span>
              <span className="shrink-0 text-xs text-neutral-300">
                {exhausted ? "No licences" : `${option.available} left`}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
