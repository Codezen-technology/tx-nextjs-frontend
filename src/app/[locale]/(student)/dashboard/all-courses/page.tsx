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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAllCategories,
  useStudentCourses,
  useStudentSubscription,
} from "@/lib/hooks/useStudentDashboard";
import Link from "next/link";

export default function AllCoursesPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState<SortOption>("recently_accessed");
  const [category, setCategory] = useState<number | undefined>();

  const gridRef = useRef<HTMLDivElement>(null);

  const { data: subscription } = useStudentSubscription();
  const { data: categories } = useAllCategories();

  const coursesQuery = useStudentCourses({
    access: "all",
    page,
    per_page: 12,
    search: search || undefined,
    orderby: sort,
    category,
  });

  const planName =
    subscription?.active_subscription?.plan_name ??
    subscription?.lifetime_membership?.product?.name;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-[#2e4450]">All Courses</h1>
          {planName && (
            <Badge className="bg-lms-secondary text-white">Subscription: {planName}</Badge>
          )}
        </div>
        {subscription?.active_subscription && (
          <Link
            href="/subscription"
            className="text-sm font-semibold text-lms-secondary hover:underline"
          >
            View Subscription Status ↗
          </Link>
        )}
      </div>

      <hr className="mb-4 border-[#eaecee]" />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <CourseFilterBar
          search={search}
          sort={sort}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onSortChange={(v) => {
            setSort(v);
            setPage(1);
          }}
          onReset={() => {
            setSearch("");
            setSort("recently_accessed");
            setCategory(undefined);
            setPage(1);
          }}
        />
        {categories?.categories && categories.categories.length > 0 && (
          <Select
            value={category?.toString() ?? "all"}
            onValueChange={(v) => {
              setCategory(v === "all" ? undefined : Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.categories.map((cat) => (
                <SelectItem key={cat.term_id} value={String(cat.term_id)}>
                  {cat.name} ({cat.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div ref={gridRef} />

      {coursesQuery.isError && <DashboardErrorBanner />}

      {coursesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <CatalogCourseCardSkeleton key={i} />
          ))}
        </div>
      ) : !coursesQuery.data?.courses.length ? (
        <EmptyState title="No courses found" description="Try adjusting your filters." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {coursesQuery.data.courses.map((course) => (
              <CatalogCourseCard key={course.id} course={course} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={coursesQuery.data.totalPages ?? 1}
            onPageChange={(p) => {
              setPage(p);
              gridRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            className="mt-8"
          />
        </>
      )}

      <PromoCardsSection />
    </div>
  );
}
