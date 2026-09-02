"use client";

import { usePopularCourses } from "@/lib/hooks/useCourses";
import { CourseCard, CourseCardSkeleton } from "@/components/courses/course-card";

/**
 * "Customers Also Purchased" — the cart frame's suggestion section (6239:113955).
 *
 * Reads `/courses/popular` (ordered by student count). It previously asked
 * `/courses` for `orderby=popularity`, which that endpoint does not accept, so
 * the heading would have introduced the three newest courses as ones other
 * customers bought.
 */
export function RelatedCourses() {
  const { data, isLoading } = usePopularCourses(3);
  const courses = (data?.items ?? []).slice(0, 3);

  // No heading without courses under it — an empty "Customers Also Purchased"
  // reads as a failed section rather than an absent one.
  if (!isLoading && courses.length === 0) return null;

  return (
    <section>
      <h2 className="font-suse mb-6 text-2xl font-medium text-neutral-900">
        Customers Also Purchased
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? [1, 2, 3].map((i) => <CourseCardSkeleton key={i} />)
          : courses.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
    </section>
  );
}
