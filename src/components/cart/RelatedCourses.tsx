"use client";

import { useCourses } from "@/lib/hooks/useCourses";
import { CourseCard, CourseCardSkeleton } from "@/components/courses/course-card";

export function RelatedCourses() {
  const { data, isLoading } = useCourses({ perPage: 3, orderBy: "popularity" });

  return (
    <section>
      <h2 className="mb-6 font-suse text-2xl font-medium text-[#00204a]">
        Customers Also Purchased
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? [1, 2, 3].map((i) => <CourseCardSkeleton key={i} />)
          : (data?.items ?? []).slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
      </div>
    </section>
  );
}
