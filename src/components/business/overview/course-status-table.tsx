"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/business/status-badge";
import { UsageBar } from "@/components/business/usage-bar";
import { useBusinessCourseLearners } from "@/lib/hooks/useBusinessDashboard";
import { cn } from "@/lib/utils/cn";
import type { AssignmentListCourse } from "@/types/business-dashboard";
import { formatBusinessDate } from "@/lib/utils/business-dates";

const ROSTER_PER_PAGE = 10;

/**
 * The learner roster for one course, loaded only once the row is expanded.
 *
 * Rendering this eagerly for every course would fire one request per row on
 * page load, so the parent mounts it lazily and keeps a single row open.
 */
function CourseRoster({ courseId }: { courseId: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useBusinessCourseLearners(courseId, {
    page,
    per_page: ROSTER_PER_PAGE,
  });

  const learners = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  if (isLoading) {
    return (
      <div className="space-y-2 px-5 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="px-5 py-4 text-sm text-red-600">Could not load learners for this course.</p>
    );
  }

  if (learners.length === 0) {
    return <EmptyState className="m-4 border-0" title="No learners on this course yet" />;
  }

  return (
    <div className="space-y-3 px-5 py-4">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold tracking-wide text-neutral-300 uppercase">
            <th className="pb-2">Name</th>
            <th className="pb-2">Email</th>
            <th className="w-40 pb-2">Progress</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Completed</th>
          </tr>
        </thead>
        <tbody className="divide-neutral-30 divide-y">
          {learners.map((learner) => {
            const progress = learner.progress ?? 0;
            const completed = progress >= 100 || !!learner.completion_date;

            return (
              <tr key={learner.id}>
                <td className="py-2 font-medium text-neutral-900">{learner.display_name}</td>
                <td className="py-2 text-neutral-700">{learner.email}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <UsageBar used={progress} total={100} className="w-24" />
                    <span className="text-xs text-neutral-300">{progress}%</span>
                  </div>
                </td>
                <td className="py-2">
                  <StatusBadge
                    status={completed ? "completed" : progress > 0 ? "in_progress" : "not_started"}
                  />
                </td>
                <td className="py-2 text-neutral-700">
                  {formatBusinessDate(learner.completion_date)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      ) : null}
    </div>
  );
}

interface CourseStatusTableProps {
  courses: AssignmentListCourse[];
  isLoading?: boolean;
  isError?: boolean;
  onAssign: (course: AssignmentListCourse) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

/**
 * Per-course progress with an expandable learner roster.
 *
 * One row is open at a time — the roster is a table inside a table, and two of
 * them stacked makes the page impossible to scan.
 */
export function CourseStatusTable({
  courses,
  isLoading,
  isError,
  onAssign,
  page,
  totalPages,
  onPageChange,
}: CourseStatusTableProps) {
  const [openCourseId, setOpenCourseId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="border-neutral-30 space-y-3 rounded-xl border bg-white p-5 shadow-xs">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-neutral-30 rounded-xl border bg-white p-10 text-center text-sm text-red-600 shadow-xs">
        Could not load course progress.
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        title="No courses assigned yet"
        description="Assign a course to your learners to see progress here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-neutral-30 overflow-hidden rounded-xl border bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-neutral-30 bg-neutral-10 border-b text-xs font-semibold tracking-wide text-neutral-300 uppercase">
                <th className="w-10 px-5 py-3" />
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Learners</th>
                <th className="px-5 py-3">Completed</th>
                <th className="w-48 px-5 py-3">Progress</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-neutral-30 divide-y">
              {courses.map((course) => {
                const isOpen = openCourseId === course.course_id;
                const total = course.total_learners ?? 0;
                const completed = course.completion_stats?.completed ?? 0;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <Fragment key={course.course_id}>
                    <tr
                      className={cn(
                        "hover:bg-neutral-10 transition-colors",
                        isOpen && "bg-neutral-10",
                      )}
                    >
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-label={isOpen ? "Hide learners" : "Show learners"}
                          onClick={() => setOpenCourseId(isOpen ? null : course.course_id)}
                          className="text-neutral-300 transition-colors hover:text-neutral-900"
                        >
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-neutral-900">
                        {course.course_name}
                      </td>
                      <td className="px-5 py-4 text-sm text-neutral-700">{total}</td>
                      <td className="px-5 py-4 text-sm text-neutral-700">{completed}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <UsageBar used={completed} total={total} className="w-28" />
                          <span className="text-xs text-neutral-300">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button size="sm" variant="outline" onClick={() => onAssign(course)}>
                          Assign
                        </Button>
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr className="bg-neutral-10">
                        <td colSpan={6} className="p-0">
                          <CourseRoster courseId={course.course_id} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {page != null && totalPages != null && onPageChange ? (
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      ) : null}
    </div>
  );
}
