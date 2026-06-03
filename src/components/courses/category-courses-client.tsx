"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { coursesService } from "@/lib/services/courses";
import { queryKeys } from "@/lib/utils/query-keys";
import { CourseCard, CourseCardSkeleton } from "@/components/courses/course-card";
import type { Course } from "@/types/course";
import type { PaginatedResponse } from "@/types/api";

interface CategoryCoursesClientProps {
  initialData: PaginatedResponse<Course>;
  categorySlug: string;
  categoryName: string;
  categoryDescription?: string | null;
  perPage: number;
}

export function CategoryCoursesClient({
  initialData,
  categorySlug,
  categoryName,
  categoryDescription,
  perPage,
}: CategoryCoursesClientProps) {
  const [page, setPage] = useState(1);

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.courses.list({ category: categorySlug, page, perPage }),
    queryFn: () => coursesService.list({ category: categorySlug, page, perPage }),
    initialData: page === 1 ? initialData : undefined,
    placeholderData: (prev) => prev,
  });

  const courses = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  function handlePage(next: number) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[1296px] px-4 py-12">
        {/* Section header */}
        <div className="mb-8">
          <h2 className="font-suse text-[32px] font-bold leading-[1.2] text-neutral-900">
            {categoryName} Courses
          </h2>
          {categoryDescription ? (
            <p className="mt-3 max-w-[856px] font-open-sans text-[16px] leading-[1.6] text-neutral-500">
              {categoryDescription}
            </p>
          ) : null}
          {total > 0 ? (
            <p className="mt-2 font-open-sans text-[14px] text-neutral-400">
              {total} course{total !== 1 ? "s" : ""} available
            </p>
          ) : null}
        </div>

        {/* Course grid */}
        {isFetching && !data ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: perPage }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="font-open-sans text-[16px] text-neutral-400">
              No courses found in this category.
            </p>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-4 ${
              isFetching ? "opacity-50" : "opacity-100"
            }`}
          >
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePage(Math.max(1, page - 1))}
              disabled={page === 1}
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ebedf1] text-neutral-500 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <PageNumbers current={page} total={totalPages} onChange={handlePage} />

            <button
              onClick={() => handlePage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ebedf1] text-neutral-500 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PageNumbers({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const pages = buildPageRange(current, total);

  return (
    <>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 font-open-sans text-sm text-neutral-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            aria-current={current === p ? "page" : undefined}
            className={`flex h-9 w-9 items-center justify-center rounded-full border font-open-sans text-sm transition-colors ${
              current === p
                ? "border-secondary-500 bg-secondary-500 text-white"
                : "border-[#ebedf1] text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {p}
          </button>
        ),
      )}
    </>
  );
}

function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
