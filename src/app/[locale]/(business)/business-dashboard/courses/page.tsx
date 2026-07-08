"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, BookOpen, CheckCircle2, Clock, Search, UserPlus, Users } from "lucide-react";
import { AssignCourseModal } from "@/components/business/assign-course-modal";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { useBusinessAssignmentList } from "@/lib/hooks/useBusinessDashboard";
import type { AssignmentListCourse } from "@/types/business-dashboard";

const PER_PAGE = 9;

function CourseCard({
  course,
  onAssign,
}: {
  course: AssignmentListCourse;
  onAssign: (course: AssignmentListCourse) => void;
}) {
  const stats = course.completion_stats;
  const items = [
    { label: "Learners", value: course.total_learners, icon: Users },
    { label: "In Progress", value: stats?.active, icon: Clock },
    { label: "Completed", value: stats?.completed, icon: CheckCircle2 },
    { label: "Certificates", value: stats?.certificate_count, icon: Award },
  ];
  return (
    <div className="border-neutral-30 rounded-xl border bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3F576F]/10 text-[#3F576F]">
          <BookOpen className="h-5 w-5" />
        </span>
        <h3 className="line-clamp-2 font-semibold text-neutral-900">{course.course_name}</h3>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        {items.map((s) => (
          <div key={s.label} className="bg-neutral-10 rounded-lg p-3">
            <dt className="flex items-center gap-1.5 text-xs text-neutral-300">
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </dt>
            <dd className="mt-1 text-lg font-bold text-neutral-900">{s.value ?? 0}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/business-dashboard/certificates/${course.course_id}`}
          className="text-sm font-medium text-[#3F576F] hover:underline"
        >
          View learners →
        </Link>
        <Button size="sm" variant="outline" className="h-8" onClick={() => onAssign(course)}>
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          Assign more
        </Button>
      </div>
    </div>
  );
}

export default function BusinessAssignedCoursesPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [assignTarget, setAssignTarget] = useState<AssignmentListCourse | null>(null);

  const { data, isLoading, isError } = useBusinessAssignmentList({
    page,
    per_page: PER_PAGE,
    search,
  });

  const rows = data?.items ?? data?.courses ?? [];
  const totalPages = data?.pages ?? 1;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Assigned Courses"
        description="Courses your team is enrolled in, with completion stats."
      />

      <form onSubmit={onSearch} className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-300" />
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
              className="border-neutral-30 h-44 animate-pulse rounded-xl border bg-white"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="border-neutral-30 rounded-xl border bg-white p-10 text-center text-sm text-red-600">
          Could not load courses. Please try again.
        </div>
      ) : !rows.length ? (
        <EmptyState
          title="No assigned courses"
          description="Courses you assign to learners will appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((course) => (
              <CourseCard key={course.course_id} course={course} onAssign={setAssignTarget} />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      <AssignCourseModal
        courseId={assignTarget?.course_id ?? null}
        courseName={assignTarget?.course_name ?? ""}
        open={assignTarget != null}
        onOpenChange={(open) => !open && setAssignTarget(null)}
      />
    </div>
  );
}
