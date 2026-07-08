"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCourse } from "@/lib/hooks/useCourses";
import { useCourseProgress } from "@/lib/hooks/useUnits";
import { formatDate, pluralize } from "@/lib/utils/format";
import type { Enrollment } from "@/types/enrollment";

interface EnrolledCourseCardProps {
  enrollment: Enrollment;
}

export function EnrolledCourseCard({ enrollment }: EnrolledCourseCardProps) {
  const { data: course, isLoading } = useCourse(enrollment.courseId, {
    enabled: !enrollment.course,
  });
  const { data: progress } = useCourseProgress(enrollment.courseId);
  const c = enrollment.course ?? course;

  const percent =
    progress?.percent ?? (enrollment.progress !== undefined ? Math.round(enrollment.progress) : 0);
  const completed = progress?.completedUnits ?? enrollment.completedUnits ?? 0;
  const total =
    progress?.totalUnits ?? enrollment.totalUnits ?? c?.unitsCount ?? c?.lessonsCount ?? 0;

  if (isLoading && !c) {
    return (
      <Card>
        <Skeleton className="aspect-3/1 w-full rounded-b-none" />
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!c) return null;

  const targetUrl = enrollment.lastAccessedUnitId
    ? `/learn/${c.id}/${enrollment.lastAccessedUnitId}`
    : `/learn/${c.id}/start`;

  return (
    <Card className="overflow-hidden">
      <div className="bg-muted relative aspect-3/1 w-full">
        {c.featuredImage ? (
          <Image
            src={c.featuredImage}
            alt={c.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <GraduationCap className="h-10 w-10" />
          </div>
        )}
        {enrollment.status === "completed" || percent === 100 ? (
          <Badge variant="success" className="absolute top-3 right-3">
            Completed
          </Badge>
        ) : null}
      </div>

      <CardContent className="space-y-3 p-5">
        <div>
          <h3 className="line-clamp-2 font-semibold">
            <Link href={`/course/${c.slug}`} className="hover:text-primary">
              {c.title}
            </Link>
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Enrolled {formatDate(enrollment.enrolledAt)}
          </p>
        </div>

        <div className="space-y-1.5">
          <Progress value={percent} />
          <p className="text-muted-foreground text-xs">
            {completed}/{total} {pluralize(total, "unit")} \u2022 {percent}%
          </p>
        </div>

        <Button asChild size="sm" className="w-full">
          <Link href={targetUrl}>
            {percent > 0 && percent < 100
              ? "Continue learning"
              : percent === 100
                ? "Review"
                : "Start learning"}
            <ArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
