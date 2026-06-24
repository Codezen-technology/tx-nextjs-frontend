"use client";

import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { AssignCourseModal } from "@/components/business/assign-course-modal";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { useBusinessCourses } from "@/lib/hooks/useBusinessDashboard";
import type { AssignedCourse } from "@/types/business-dashboard";

const PER_PAGE = 9;

export default function BusinessAssignCoursesPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [assignTarget, setAssignTarget] = useState<AssignedCourse | null>(null);

  const { data, isLoading, isError } = useBusinessCourses({
    page,
    per_page: PER_PAGE,
    search,
  });

  const courses = data?.courses ?? [];
  const totalPages = data?.pages ?? (Math.ceil((data?.total ?? 0) / PER_PAGE) || 1);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Assign Courses"
        description="Browse the course catalogue and assign learners."
      />

      <form onSubmit={onSearch} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-300" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search courses..."
          className="pl-9"
        />
      </form>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-neutral-30 bg-white"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-neutral-30 bg-white p-10 text-center text-sm text-red-600">
          Could not load courses.
        </div>
      ) : !courses.length ? (
        <EmptyState title="No courses found" description="Try adjusting your search." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course: AssignedCourse) => (
              <div
                key={course.id}
                className="rounded-xl border border-neutral-30 bg-white p-5 shadow-sm"
              >
                {course.featured_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.featured_image}
                    alt=""
                    className="mb-3 h-32 w-full rounded-lg object-cover"
                  />
                ) : null}
                <h3 className="font-semibold text-neutral-900">{course.name}</h3>
                {course.excerpt ? (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-300">{course.excerpt}</p>
                ) : null}
                {course.total_lessons != null ? (
                  <p className="mt-2 text-xs text-neutral-300">{course.total_lessons} lessons</p>
                ) : null}
                <Button
                  size="sm"
                  className="mt-4 bg-[#3F576F] hover:bg-[#33485d]"
                  onClick={() => setAssignTarget(course)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign
                </Button>
              </div>
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
