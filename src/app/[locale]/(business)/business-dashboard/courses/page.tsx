"use client";

import { useState } from "react";
import { Award, BookOpen, CheckCircle2, Clock, Search, Users } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { useBusinessReportCourses } from "@/lib/hooks/useBusinessDashboard";
import type { ReportCourse } from "@/types/business-dashboard";

const PER_PAGE = 9;

function CourseCard({ course }: { course: ReportCourse }) {
  const stats = [
    { label: "Assigned", value: course.assigned_count, icon: Users },
    { label: "In Progress", value: course.in_progress_count, icon: Clock },
    { label: "Completed", value: course.completed_count, icon: CheckCircle2 },
    { label: "Certificates", value: course.certificate_count, icon: Award },
  ];
  return (
    <div className="rounded-xl border border-neutral-30 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3F576F]/10 text-[#3F576F]">
          <BookOpen className="h-5 w-5" />
        </span>
        <h3 className="line-clamp-2 font-semibold text-neutral-900">{course.name}</h3>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-neutral-10 p-3">
            <dt className="flex items-center gap-1.5 text-xs text-neutral-300">
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </dt>
            <dd className="mt-1 text-lg font-bold text-neutral-900">{s.value ?? 0}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function BusinessAssignedCoursesPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useBusinessReportCourses({
    page,
    per_page: PER_PAGE,
    search,
  });

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
              className="h-44 animate-pulse rounded-xl border border-neutral-30 bg-white"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-neutral-30 bg-white p-10 text-center text-sm text-red-600">
          Could not load courses. Please try again.
        </div>
      ) : !data?.items?.length ? (
        <EmptyState
          title="No assigned courses"
          description="Courses you assign to learners will appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((course: ReportCourse) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
