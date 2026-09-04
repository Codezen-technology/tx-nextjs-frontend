"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Search } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { StatusBadge } from "@/components/business/status-badge";
import { UsageBar } from "@/components/business/usage-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLearnerCoursesReport, useReportCourseOptions } from "@/lib/hooks/useBusinessDashboard";
import { downloadCsv } from "@/lib/utils/business-csv";
import type { LearnerCourseRecord, ReportStatus } from "@/types/business-dashboard";

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const VIEWS: Record<ReportStatus, { title: string; subtitle: string }> = {
  all: { title: "All learners", subtitle: "Every learner and course enrolment." },
  completed: { title: "Completed", subtitle: "Enrolments finished at or above the passing mark." },
  in_progress: { title: "In progress", subtitle: "Started but not yet finished." },
  not_started: { title: "Not started", subtitle: "Assigned but never opened." },
  failed: { title: "Failed", subtitle: "Finished below the passing mark." },
};

function isReportStatus(value: string | null): value is ReportStatus {
  return value != null && value in VIEWS;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
}

function StatusReport() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters live in the URL so a view can be linked to and shared.
  const reportParam = searchParams.get("report");
  const status: ReportStatus = isReportStatus(reportParam) ? reportParam : "all";
  const courseId = Number(searchParams.get("course_id")) || undefined;
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page")) || 1;
  const perPage = Number(searchParams.get("per_page")) || PER_PAGE_OPTIONS[0];

  const [searchInput, setSearchInput] = useState(search);

  const { data, isLoading, isError } = useLearnerCoursesReport({
    status,
    course_id: courseId,
    search: search || undefined,
    page,
    per_page: perPage,
  });
  const { data: courseOptions } = useReportCourseOptions();

  const rows = data?.items ?? [];
  const view = VIEWS[status];

  const setParam = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, value);
    }
    // Any filter change invalidates the current page number.
    if (!("page" in updates)) next.delete("page");
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const exportCsv = () => {
    downloadCsv(
      `${status}-report.csv`,
      ["Name", "Email", "Course", "Status", "Progress", "Score", "Completed", "Enrolled"],
      rows.map((r) => [
        r.learner_name,
        r.learner_email,
        r.course_title,
        r.status,
        `${r.progress}%`,
        r.score == null ? "" : String(r.score),
        formatDate(r.completion_date),
        formatDate(r.enrolled_at),
      ]),
    );
  };

  const columns: Column<LearnerCourseRecord>[] = [
    {
      key: "learner",
      header: "Name",
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{r.learner_name}</p>
          <p className="truncate text-xs text-neutral-300">{r.learner_email}</p>
        </div>
      ),
    },
    { key: "course", header: "Course", cell: (r) => r.course_title },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "progress",
      header: "Progress",
      className: "min-w-[130px]",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <UsageBar used={r.progress} total={100} className="w-20" />
          <span className="text-xs text-neutral-300">{r.progress}%</span>
        </div>
      ),
    },
    { key: "score", header: "Score", cell: (r) => (r.score == null ? "—" : `${r.score}%`) },
    { key: "completed", header: "Completed", cell: (r) => formatDate(r.completion_date) },
    { key: "enrolled", header: "Enrolled", cell: (r) => formatDate(r.enrolled_at) },
    { key: "accessed", header: "Last accessed", cell: (r) => formatDate(r.last_accessed) },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title={view.title}
        description={view.subtitle}
        actions={
          <Button asChild variant="outline">
            <Link href="/business-dashboard/analytics">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Reports
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(VIEWS) as ReportStatus[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setParam({ report: key === "all" ? undefined : key })}
            className={
              key === status
                ? "rounded-full bg-[#3F576F] px-3 py-1.5 text-sm font-medium text-white"
                : "border-neutral-30 hover:bg-neutral-10 rounded-full border px-3 py-1.5 text-sm text-neutral-700"
            }
          >
            {VIEWS[key].title}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam({ q: searchInput.trim() || undefined });
          }}
          className="relative w-full max-w-sm"
        >
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-300" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search learners..."
            className="pl-9"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={courseId ?? ""}
            onChange={(e) => setParam({ course_id: e.target.value || undefined })}
            aria-label="Filter by course"
            className="border-neutral-30 h-9 rounded-lg border bg-white px-2 text-sm text-neutral-900"
          >
            <option value="">All courses</option>
            {(courseOptions ?? []).map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            value={perPage}
            onChange={(e) => setParam({ per_page: e.target.value })}
            aria-label="Rows per page"
            className="border-neutral-30 h-9 rounded-lg border bg-white px-2 text-sm text-neutral-900"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>

          <Button variant="outline" size="sm" disabled={rows.length === 0} onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export page
          </Button>
        </div>
      </div>

      {data ? (
        <p className="text-sm text-neutral-300">
          {data.total} row{data.total === 1 ? "" : "s"} · passing mark {data.pass_mark}%
        </p>
      ) : null}

      <BusinessDataTable<LearnerCourseRecord>
        columns={columns}
        rows={rows}
        rowKey={(r) => `${r.learner_id}-${r.course_id}`}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="Nothing matches this view"
        emptyDescription="Try a different status or clear the filters."
        page={page}
        totalPages={data?.pages ?? 1}
        onPageChange={(next) => setParam({ page: String(next) })}
      />
    </div>
  );
}

export default function BusinessStatusReportPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense fallback={<div className="border-neutral-30 h-96 animate-pulse rounded-xl border" />}>
      <StatusReport />
    </Suspense>
  );
}
