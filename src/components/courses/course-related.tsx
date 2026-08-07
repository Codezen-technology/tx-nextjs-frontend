"use client";

import { useCourseRelated } from "@/lib/hooks/useCourses";
import { CourseCard, CourseCardSkeleton } from "@/components/courses/course-card";

interface CourseRelatedProps {
  courseId: number | string;
}

export function CourseRelated({ courseId }: CourseRelatedProps) {
  const { data, isLoading } = useCourseRelated(courseId);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900">Related Courses</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (!data?.items.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-neutral-900">Related Courses</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
