"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MoreVertical } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getCourseContinueUrl } from "@/lib/utils/student-dashboard";
import type { StudentCourse } from "@/types/student-dashboard";

export function CompletedCourseRow({ course }: { course: StudentCourse }) {
  const progress = course.user_progress ?? 0;
  const continueUrl = getCourseContinueUrl(course);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="flex w-full min-w-0 items-center gap-4 py-6">
        {/* Course name */}
        <h3 className="line-clamp-2 min-w-0 max-w-[350px] flex-1 text-[18px] font-bold leading-[1.3] text-[#2e4450]">
          {course.name}
        </h3>

        {/* Progress column */}
        <div className="flex w-[280px] shrink-0 flex-col gap-2">
          <span className="whitespace-nowrap text-[18px] font-medium text-[#2e323e]">
            {progress}% Completed
          </span>
          <Progress
            value={progress}
            className="h-2 max-w-[248px] bg-[#eaecee] [&>div]:bg-[#3f9751]"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <Link
            href={continueUrl}
            className="flex h-14 min-w-[140px] max-w-[220px] flex-1 items-center justify-center rounded-lg bg-[#eaecee] text-[18px] font-bold text-[#2e4450] transition hover:bg-[#d8dadc]"
          >
            Reset Course
          </Link>
          <Link
            href="/dashboard/my-learning?tab=certificates"
            className="flex h-14 min-w-[140px] max-w-[220px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#3f4d97] text-[18px] font-bold text-[#f6f6fa] transition hover:bg-[#323d7a]"
          >
            Claim Certificate
            <ArrowRight className="h-[18px] w-[18px] shrink-0" />
          </Link>
        </div>

        {/* 3-dot menu */}
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="More options"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-6 w-6 items-center justify-center text-[#2e4450]"
          >
            <MoreVertical className="h-6 w-6" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg bg-white py-1 shadow-md ring-1 ring-black/5">
                <Link
                  href="/dashboard/my-learning?tab=certificates"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-[#2e4450] hover:bg-[#f6f6fa]"
                >
                  Claim Certificate
                </Link>
                <Link
                  href={continueUrl}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-[#2e4450] hover:bg-[#f6f6fa]"
                >
                  Reset Course
                </Link>
                {course.link && (
                  <a
                    href={course.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[#2e4450] hover:bg-[#f6f6fa]"
                  >
                    View Course
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <hr className="border-[#eaecee]" />
    </>
  );
}

export function CompletedCourseRowSkeleton() {
  return (
    <>
      <div className="flex w-full min-w-0 items-center gap-4 py-6">
        <Skeleton className="h-7 max-w-[350px] flex-1 bg-[#e2e8ee]" />
        <div className="flex w-[280px] shrink-0 flex-col gap-2">
          <Skeleton className="h-6 w-36 bg-[#e2e8ee]" />
          <Skeleton className="h-2 w-[248px] rounded bg-[#e2e8ee]" />
        </div>
        <div className="flex flex-1 gap-2">
          <Skeleton className="h-14 min-w-[140px] max-w-[220px] flex-1 rounded-lg bg-[#e2e8ee]" />
          <Skeleton className="h-14 min-w-[140px] max-w-[220px] flex-1 rounded-lg bg-[#e2e8ee]" />
        </div>
        <Skeleton className="h-6 w-6 shrink-0 rounded bg-[#e2e8ee]" />
      </div>
      <hr className="border-[#eaecee]" />
    </>
  );
}
