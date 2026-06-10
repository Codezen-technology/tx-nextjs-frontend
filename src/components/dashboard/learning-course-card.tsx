"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SafeImage } from "@/components/ui/safe-image";
import { getCourseContinueUrl } from "@/lib/utils/student-dashboard";
import type { StudentCourse } from "@/types/student-dashboard";

const FALLBACK = "/dashboard/no-image.jpg";

export function LearningCourseCard({ course }: { course: StudentCourse }) {
  const continueUrl = getCourseContinueUrl(course);
  const progress = course.user_progress ?? 0;

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-2xl bg-[#f6f6fa] transition-shadow hover:shadow-lg">
      <div className="relative h-40 overflow-hidden">
        <SafeImage
          src={course.featured_image || FALLBACK}
          alt={course.name}
          fill
          className="object-cover"
        />
        <Link
          href={continueUrl}
          className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#f6f6fa]/80 transition hover:bg-[#f6f6fa]/95"
        >
          <Play className="ml-0.5 h-8 w-8 text-[#3f4d97]" fill="currentColor" />
        </Link>
      </div>
      <div className="flex flex-col gap-2 p-4">
        {course.course_cat_names && course.course_cat_names.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {course.course_cat_names.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="rounded bg-white px-2 py-0.5 text-xs font-medium text-[#586973]"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-[#2e4450]">
          {course.name}
        </h3>
        <p className="text-xs font-semibold text-[#2e323e]">{progress}% Completed</p>
        <Progress value={progress} className="h-2 bg-[#eaecee] [&>div]:bg-[#3f4d97]" />
        <Link
          href={continueUrl}
          className="mt-1 inline-flex items-center text-sm font-semibold text-lms-primary hover:underline"
        >
          Resume →
        </Link>
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
