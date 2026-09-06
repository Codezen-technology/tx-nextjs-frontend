"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { AssignCourseModal } from "@/components/business/assign-course-modal";
import { BusinessCourseCard } from "@/components/business/course-card";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBusinessCourseCategories, useBusinessCourses } from "@/lib/hooks/useBusinessDashboard";
import type { AssignedCourse } from "@/types/business-dashboard";

const PER_PAGE = 9;

/**
 * Values must match the backend enum exactly — `B2B_Course_Service::add_ordering()`
 * switches on these strings. "Default" sends no `orderby` at all, which the
 * service reads as menu_order + date.
 */
const SORT_OPTIONS = [
  { value: "default", label: "Default order" },
  { value: "newest", label: "Most recent" },
  { value: "popular", label: "Most popular" },
  { value: "rated", label: "Top rated" },
  { value: "alphabetical", label: "Title (A–Z)" },
];

const ALL_CATEGORIES = "all";

export default function BusinessAssignCoursesPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [categoryId, setCategoryId] = useState(ALL_CATEGORIES);
  const [assignTarget, setAssignTarget] = useState<AssignedCourse | null>(null);

  const { data: categories } = useBusinessCourseCategories();

  const { data, isLoading, isError, isFetching } = useBusinessCourses({
    page,
    per_page: PER_PAGE,
    search,
    orderby: sort === "default" ? undefined : sort,
    taxonomy: categoryId === ALL_CATEGORIES ? undefined : [Number(categoryId)],
  });

  // Exclusions are applied server-side on both /courses and /course-categories,
  // so nothing is filtered here.
  const courses = data?.courses ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? (Math.ceil(total / PER_PAGE) || 1);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const isFiltered = !!search || sort !== "default" || categoryId !== ALL_CATEGORIES;

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setSort("default");
    setCategoryId(ALL_CATEGORIES);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Search courses"
        description="Browse the course catalogue and assign learners."
      />

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={onSearch} className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-300" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search courses..."
            className="pl-9"
          />
        </form>

        <Select
          value={categoryId}
          onValueChange={(value) => {
            setCategoryId(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="border-neutral-30 h-10 w-[220px] rounded-lg bg-white text-sm">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {(categories ?? []).map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name} ({category.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="border-neutral-30 h-10 w-[190px] rounded-lg bg-white text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isFiltered ? (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="mr-1.5 h-4 w-4" />
            Clear all
          </Button>
        ) : null}

        <span className="ml-auto text-sm text-neutral-300" aria-live="polite">
          {isLoading ? "Loading…" : `${total} course${total === 1 ? "" : "s"}`}
          {isFetching && !isLoading ? " · updating" : ""}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border-neutral-30 h-72 animate-pulse rounded-xl border bg-white"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="border-neutral-30 rounded-xl border bg-white p-10 text-center text-sm text-red-600">
          Could not load courses.
        </div>
      ) : !courses.length ? (
        <EmptyState
          title="No courses found"
          description={isFiltered ? "Try adjusting your filters." : "No courses are available yet."}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course: AssignedCourse) => (
              <BusinessCourseCard key={course.id} course={course} onAssign={setAssignTarget} />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      <AssignCourseModal
        courseId={assignTarget?.id ?? null}
        courseName={assignTarget?.name ?? ""}
        open={assignTarget != null}
        onOpenChange={(open) => !open && setAssignTarget(null)}
      />
    </div>
  );
}
