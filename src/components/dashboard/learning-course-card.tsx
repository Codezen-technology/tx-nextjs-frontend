"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SafeImage } from "@/components/ui/safe-image";
import { getCourseContinueUrl } from "@/lib/utils/student-dashboard";
import type { StudentCourse } from "@/types/student-dashboard";

const FALLBACK = "/dashboard/no-image.jpg";

export function LearningCourseCard({ course }: { course: StudentCourse }) {
  const continueUrl = getCourseContinueUrl(course);
  const progress = course.user_progress ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-2xl bg-[#f6f6fa] transition-shadow hover:shadow-lg">
      {/* Image + overlays */}
      <div className="relative h-40 shrink-0 overflow-hidden">
        <SafeImage
          src={course.featured_image || FALLBACK}
          alt={course.name}
          fill
          className="object-cover"
        />

        {/* Play button — frosted glass circle */}
        <Link
          href={continueUrl}
          className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#f6f6fa]/80 transition hover:bg-[#f6f6fa]/95"
          aria-label="Continue course"
        >
          <Play className="ml-0.5 h-8 w-8 text-[#3f4d97]" fill="currentColor" />
        </Link>

        {/* 3-dot menu — top-right */}
        <div className="absolute top-3 right-3">
          <button
            type="button"
            aria-label="Course options"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f6f6fa] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.2)] transition hover:bg-white"
          >
            <MoreVertical className="h-[18px] w-[18px] text-[#2e4450]" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-full right-0 z-20 mt-1 min-w-[160px] rounded-2xl bg-white py-2 shadow-[0_2px_8px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
                <Link
                  href={continueUrl}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-[#2e4450] hover:bg-[#f6f6fa]"
                >
                  Continue Learning
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

      {/* Body */}
      <div className="flex flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-[18px] leading-[1.3] font-bold text-[#2e4450]">
          {course.name}
        </h3>
        <p className="text-xs font-semibold text-[#2e323e]">{progress}% Completed</p>
        <Progress value={progress} className="h-2 bg-[#eaecee] [&>div]:bg-[#3f4d97]" />
      </div>
    </article>
  );
}

export function LearningCourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#f6f6fa]">
      <Skeleton className="h-40 w-full rounded-none bg-[#e2e8ee]" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-6 w-[90%] bg-[#e2e8ee]" />
        <Skeleton className="h-4 w-1/2 bg-[#e2e8ee]" />
        <Skeleton className="h-2 w-full bg-[#e2e8ee]" />
      </div>
    </div>
  );
}
