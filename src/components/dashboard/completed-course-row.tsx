"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SafeImage } from "@/components/ui/safe-image";
import { getCourseContinueUrl } from "@/lib/utils/student-dashboard";
import type { StudentCourse } from "@/types/student-dashboard";

const FALLBACK = "/dashboard/no-image.jpg";

export function CompletedCourseRow({ course }: { course: StudentCourse }) {
  const progress = course.user_progress ?? 0;
  const continueUrl = getCourseContinueUrl(course);

  return (
    <>
      <div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center">
        <div className="hidden shrink-0 lg:block">
          <SafeImage
            src={course.featured_image || FALLBACK}
            alt={course.name}
            width={80}
            height={80}
            className="rounded-lg object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 lg:max-w-md">
          <h3 className="line-clamp-2 text-lg font-bold text-[#2e4450]">{course.name}</h3>
          {course.display_start_date && (
            <p className="mt-1 text-sm text-[#586973]">Completed · {course.display_start_date}</p>
          )}
        </div>
        <div className="flex min-w-[200px] flex-col gap-2">
          <span className="text-lg font-medium text-[#2e323e]">{progress}% Completed</span>
          <Progress
            value={progress}
            className="h-2 max-w-[248px] bg-[#eaecee] [&>div]:bg-[#3f9751]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <Button
            asChild
            variant="secondary"
            className="bg-[#eaecee] text-[#2e4450] hover:bg-[#d8dadc]"
          >
            <Link href={continueUrl}>Reset Course</Link>
          </Button>
          <Button asChild className="bg-[#3f4d97] text-[#f6f6fa] hover:bg-[#323d7a]">
            <Link href={continueUrl}>
              View Certificate
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
      <hr className="border-[#eaecee]" />
    </>
  );
}

export function CompletedCourseRowSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center">
        <Skeleton className="hidden h-20 w-20 lg:block" />
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-2 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-40" />
        </div>
      </div>
      <hr className="border-[#eaecee]" />
    </>
  );
}
