import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseCard } from "@/components/courses/course-card";
import { categoryCtaText } from "@/lib/utils/category-label";
import type { ApiCategory } from "@/lib/api/server";
import type { Course } from "@/types/course";

interface CoursesByCategorySectionProps {
  category: ApiCategory;
  courses: Course[];
}

export function CoursesByCategorySection({ category, courses }: CoursesByCategorySectionProps) {
  if (courses.length === 0) return null;

  const viewAllHref = `/course-cat/${category.slug}`;
  // One label for both CTA surfaces — the frame carries both and they must agree.
  const viewAllLabel = categoryCtaText(category.name);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {/* Stacked below `sm`: side by side, the 32px heading wrapped to two
            lines and squeezed the CTA into two more beside it. The heading also
            drops below the hero's H1 there rather than matching it. */}
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-suse text-[24px] leading-[1.2] font-bold text-neutral-900 sm:text-[32px]">
            {category.name}
          </h2>
          <Link
            href={viewAllHref}
            className="font-open-sans text-secondary-500 hover:text-secondary-600 inline-flex items-center gap-1 text-[16px] leading-normal"
          >
            {viewAllLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {category.description && (
          <p className="font-open-sans text-[16px] leading-normal text-neutral-500">
            {category.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      <div className="relative flex items-center justify-center py-2">
        <div className="bg-neutral-30 absolute inset-x-0 top-1/2 h-px" />
        <Link
          href={viewAllHref}
          className="border-secondary-500 font-open-sans text-secondary-500 hover:bg-secondary-50 relative inline-flex items-center gap-2 rounded-full border bg-white px-[17px] py-[9px] text-[16px] leading-normal transition-colors"
        >
          {viewAllLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
