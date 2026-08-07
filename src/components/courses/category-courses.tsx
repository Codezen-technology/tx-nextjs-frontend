import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CourseCard } from "@/components/courses/course-card";
import type { Course } from "@/types/course";
import type { PaginatedResponse } from "@/types/api";

interface CategoryCoursesProps {
  data: PaginatedResponse<Course>;
  categoryName: string;
  categoryDescription?: string | null;
  currentPage: number;
  basePath: string;
}

export function CategoryCourses({
  data,
  categoryName,
  categoryDescription,
  currentPage,
  basePath,
}: CategoryCoursesProps) {
  const courses = data.items ?? [];
  const totalPages = data.totalPages ?? 1;
  const total = data.total ?? 0;

  function pageHref(p: number) {
    return p <= 1 ? basePath : `${basePath}?page=${p}`;
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[1296px] px-4 py-12">
        {/* Section header */}
        <div className="mb-8">
          <h2 className="font-suse text-[32px] leading-[1.2] font-bold text-neutral-900">
            {categoryName} Courses
          </h2>
          {categoryDescription ? (
            <p className="font-open-sans mt-3 max-w-[856px] text-[16px] leading-[1.6] text-neutral-500">
              {categoryDescription}
            </p>
          ) : null}
          {total > 0 ? (
            <p className="font-open-sans mt-2 text-[14px] text-neutral-400">
              {total} course{total !== 1 ? "s" : ""} available
            </p>
          ) : null}
        </div>

        {/* Course grid */}
        {courses.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="font-open-sans text-[16px] text-neutral-400">
              No courses found in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <nav aria-label="Course pages" className="mt-10 flex items-center justify-center gap-4">
            <span className="font-open-sans text-[14px] text-neutral-500">Total {total} items</span>
            <div className="border-neutral-30 flex items-center overflow-hidden rounded-lg border bg-white">
              {currentPage === 1 ? (
                <span
                  aria-label="Previous page"
                  aria-disabled="true"
                  className="border-neutral-30 flex h-7.75 cursor-not-allowed items-center justify-center border-r px-2.25 py-2 text-neutral-400 opacity-40"
                >
                  <ChevronLeft className="text-secondary-500 h-4 w-4" />
                </span>
              ) : (
                <Link
                  href={pageHref(currentPage - 1)}
                  aria-label="Previous page"
                  className="border-neutral-30 hover:bg-secondary-50 flex h-7.75 items-center justify-center border-r px-2.25 py-2 text-neutral-500 transition-colors"
                >
                  <ChevronLeft className="text-secondary-500 h-4 w-4" />
                </Link>
              )}

              <PageLinks current={currentPage} total={totalPages} pageHref={pageHref} />

              {currentPage === totalPages ? (
                <span
                  aria-label="Next page"
                  aria-disabled="true"
                  className="border-neutral-30 flex h-7.75 cursor-not-allowed items-center justify-center border-l px-2.25 py-2 text-neutral-400 opacity-40"
                >
                  <ChevronRight className="text-secondary-500 h-4 w-4" />
                </span>
              ) : (
                <Link
                  href={pageHref(currentPage + 1)}
                  aria-label="Next page"
                  className="border-neutral-30 hover:bg-secondary-50 flex h-7.75 items-center justify-center border-l px-2.25 py-2 text-neutral-500 transition-colors"
                >
                  <ChevronRight className="text-secondary-500 h-4 w-4" />
                </Link>
              )}
            </div>
          </nav>
        ) : null}
      </div>
    </div>
  );
}

function PageLinks({
  current,
  total,
  pageHref,
}: {
  current: number;
  total: number;
  pageHref: (p: number) => string;
}) {
  const pages = buildPageRange(current, total);

  return (
    <>
      {pages.map((p, i) => {
        const isLast = i === pages.length - 1;
        return p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className={`font-open-sans text-secondary-500 border-neutral-30 flex h-7.75 items-center justify-center px-2.25 py-1.25 text-[14px] ${isLast ? "border-l" : "border-r"}`}
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(p as number)}
            aria-current={current === p ? "page" : undefined}
            className={`font-open-sans flex h-7.75 items-center justify-center px-2.25 py-1.25 text-[14px] transition-colors ${
              current === p
                ? "bg-secondary-500 text-white"
                : "text-secondary-500 border-neutral-30 border-r underline"
            }`}
          >
            {p}
          </Link>
        );
      })}
    </>
  );
}

function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 4) pages.push("...");
  for (let p = Math.max(2, current - 2); p <= Math.min(total - 1, current + 2); p++) {
    pages.push(p);
  }
  if (current < total - 3) pages.push("...");
  pages.push(total);
  return pages;
}
