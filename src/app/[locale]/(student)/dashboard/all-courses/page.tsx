"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CatalogCourseCard,
  CatalogCourseCardSkeleton,
} from "@/components/dashboard/catalog-course-card";
import { CourseFilterBar, type SortOption } from "@/components/dashboard/course-filter-bar";
import { PromoCardsSection } from "@/components/dashboard/promo-cards-section";
import { DashboardErrorBanner } from "@/components/dashboard/dashboard-error-banner";
import {
  useAllCategories,
  useStudentCourses,
  useStudentSubscription,
} from "@/lib/hooks/useStudentDashboard";
import { useDebounce } from "@/lib/hooks/useDebounce";
import Link from "next/link";

const SKELETON_COUNT = 8;

export default function AllCoursesPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState<SortOption>("recently_accessed");
  const [category, setCategory] = useState<number | undefined>();

  // Debounce the search value so the API is only called after typing stops
  const debouncedSearch = useDebounce(search, 350);

  const gridRef = useRef<HTMLDivElement>(null);

  const { data: subscription } = useStudentSubscription();
  const { data: categoriesData } = useAllCategories();

  // Use debouncedSearch for the actual API query
  const coursesQuery = useStudentCourses({
    access: "all",
    page,
    per_page: SKELETON_COUNT,
    search: debouncedSearch || undefined,
    orderby: sort,
    category,
  });

  const planName =
    subscription?.active_subscription?.plan_name ??
    subscription?.lifetime_membership?.product?.name;

  const totalCourses = coursesQuery.data?.total ?? 0;
  const totalPages = coursesQuery.data?.totalPages ?? 1;
  const courses = coursesQuery.data?.courses ?? [];

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const handleSortChange = (v: SortOption) => {
    setSort(v);
    setPage(1);
  };

  const handleCategoryChange = (v: number | undefined) => {
    setCategory(v);
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setSort("recently_accessed");
    setCategory(undefined);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-[#2e4450]">All Courses</h1>
          {planName && (
            <Badge className="bg-lms-secondary text-white">Subscription: {planName}</Badge>
          )}
          {!coursesQuery.isLoading && totalCourses > 0 && (
            <span className="text-sm text-[#73828a]">
              {totalCourses} course{totalCourses !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {subscription?.active_subscription && (
          <Link
            href="/dashboard/subscription"
            className="text-lms-secondary text-sm font-semibold hover:underline"
          >
            View Subscription Status ↗
          </Link>
        )}
      </div>

      <hr className="mb-4 border-[#eaecee]" />

      {/* Unified filter bar */}
      <div className="mb-5" ref={gridRef}>
        <CourseFilterBar
          search={search}
          sort={sort}
          category={category}
          categories={categoriesData?.categories}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          onCategoryChange={handleCategoryChange}
          onReset={handleReset}
        />
      </div>

      {/* Error */}
      {coursesQuery.isError && <DashboardErrorBanner />}

      {/* Loading skeletons */}
      {coursesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <CatalogCourseCardSkeleton key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          title="No courses found"
          description={
            debouncedSearch || category
              ? "Try adjusting your search or filters."
              : "No courses are available yet."
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CatalogCourseCard key={course.id} course={course} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          )}
        </>
      )}

      <PromoCardsSection />
    </div>
  );
}
