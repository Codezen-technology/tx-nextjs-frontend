"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useTrainingMatrix } from "@/lib/hooks/useBusinessDashboard";
import { downloadCsv } from "@/lib/utils/business-csv";
import { cn } from "@/lib/utils/cn";
import type { LearnerCourseRecord } from "@/types/business-dashboard";
import { formatBusinessDateBlank } from "@/lib/utils/business-dates";

type CellStatus = LearnerCourseRecord["status"] | "not_enrolled";

const CELL_LABELS: Record<CellStatus, string> = {
  completed: "Passed",
  failed: "Failed",
  in_progress: "In progress",
  not_started: "Not started",
  not_enrolled: "—",
};

const CELL_CLASSES: Record<CellStatus, string> = {
  completed: "bg-emerald-50 text-emerald-800",
  failed: "bg-red-50 text-red-800",
  in_progress: "bg-sky-50 text-sky-800",
  not_started: "bg-amber-50 text-amber-800",
  not_enrolled: "bg-white text-neutral-200",
};

export default function TrainingMatrixPage() {
  const [colourView, setColourView] = useState(false);
  const [passMark, setPassMark] = useState<number | undefined>(undefined);

  const { data, isLoading, isError } = useTrainingMatrix({ pass_mark: passMark });

  /** Sparse cells keyed for O(1) lookup — a missing key means not enrolled. */
  const cellIndex = useMemo(() => {
    const map = new Map<string, LearnerCourseRecord>();
    for (const cell of data?.cells ?? []) {
      map.set(`${cell.learner_id}:${cell.course_id}`, cell);
    }
    return map;
  }, [data?.cells]);

  const totalsByCourse = useMemo(
    () => new Map((data?.course_totals ?? []).map((t) => [t.course_id, t])),
    [data?.course_totals],
  );

  const learners = data?.learners ?? [];
  const courses = data?.courses ?? [];

  const exportCsv = () => {
    downloadCsv(
      "training-matrix.csv",
      ["Learner", "Email", ...courses.map((c) => c.title)],
      learners.map((learner) => [
        learner.name,
        learner.email,
        ...courses.map((course) => {
          const cell = cellIndex.get(`${learner.id}:${course.course_id}`);
          if (!cell) return CELL_LABELS.not_enrolled;
          const detail =
            cell.status === "completed" || cell.status === "failed"
              ? formatBusinessDateBlank(cell.completion_date)
              : `${cell.progress}%`;
          return detail ? `${CELL_LABELS[cell.status]} (${detail})` : CELL_LABELS[cell.status];
        }),
      ]),
    );
  };

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Training matrix"
        description="Every learner against every course they are enrolled on."
        actions={
          <Button asChild variant="outline">
            <Link href="/business-dashboard/analytics">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Reports
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          Passing mark
          <select
            value={passMark ?? ""}
            onChange={(e) => setPassMark(e.target.value ? Number(e.target.value) : undefined)}
            className="border-neutral-30 h-9 rounded-lg border bg-white px-2 text-sm"
          >
            {/* Empty means "use the business setting" — the API treats an absent
                pass_mark differently from any explicit value. */}
            <option value="">Organisation default{data ? ` (${data.pass_mark}%)` : ""}</option>
            {[50, 60, 70, 80, 90, 100].map((n) => (
              <option key={n} value={n}>
                {n}%
              </option>
            ))}
          </select>
        </label>

        <div className="border-neutral-30 inline-flex rounded-lg border bg-white p-1">
          {[
            { value: false, label: "Labels" },
            { value: true, label: "Colours" },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setColourView(option.value)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                colourView === option.value
                  ? "bg-[#3F576F] text-white"
                  : "hover:bg-neutral-10 text-neutral-700",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          disabled={learners.length === 0}
          onClick={exportCsv}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.keys(CELL_LABELS) as CellStatus[]).map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className={cn("h-3 w-3 rounded-sm border border-neutral-200", CELL_CLASSES[key])}
            />
            {key === "not_enrolled" ? "Not enrolled" : CELL_LABELS[key]}
          </span>
        ))}
      </div>

      {isLoading ? (
        <div className="border-neutral-30 h-96 animate-pulse rounded-xl border bg-white" />
      ) : isError ? (
        <div className="border-neutral-30 rounded-xl border bg-white p-10 text-center text-sm text-red-600">
          Could not load the training matrix.
        </div>
      ) : learners.length === 0 || courses.length === 0 ? (
        <EmptyState
          title="Nothing to plot yet"
          description="Assign a course to your learners and their progress will appear here."
        />
      ) : (
        <div className="border-neutral-30 overflow-auto rounded-xl border bg-white shadow-xs">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-neutral-10">
                <th className="border-neutral-30 sticky left-0 z-10 border-b bg-neutral-50 px-4 py-3 text-xs font-semibold tracking-wide text-neutral-300 uppercase">
                  Learner
                </th>
                {courses.map((course) => (
                  <th
                    key={course.course_id}
                    className="border-neutral-30 min-w-[140px] border-b px-3 py-3 text-xs font-semibold text-neutral-700"
                  >
                    {course.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-neutral-30 divide-y">
              {learners.map((learner) => (
                <tr key={learner.id}>
                  <th
                    scope="row"
                    className="border-neutral-30 sticky left-0 z-10 border-r bg-white px-4 py-2 text-left font-medium text-neutral-900"
                  >
                    <span className="block truncate">{learner.name}</span>
                    <span className="block truncate text-xs font-normal text-neutral-300">
                      {learner.email}
                    </span>
                  </th>
                  {courses.map((course) => {
                    const cell = cellIndex.get(`${learner.id}:${course.course_id}`);
                    const cellStatus: CellStatus = cell ? cell.status : "not_enrolled";
                    const detail = cell
                      ? cell.status === "completed" || cell.status === "failed"
                        ? formatBusinessDateBlank(cell.completion_date)
                        : `${cell.progress}%`
                      : "";

                    return (
                      <td
                        key={course.course_id}
                        title={`${learner.name} — ${course.title}: ${CELL_LABELS[cellStatus]}`}
                        className={cn("px-3 py-2 text-center", CELL_CLASSES[cellStatus])}
                      >
                        {colourView ? (
                          <span className="sr-only">{CELL_LABELS[cellStatus]}</span>
                        ) : (
                          <>
                            <span className="text-xs font-medium">{CELL_LABELS[cellStatus]}</span>
                            {detail ? (
                              <span className="block text-[11px] opacity-70">{detail}</span>
                            ) : null}
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-10 border-neutral-30 border-t">
                <th className="border-neutral-30 sticky left-0 z-10 border-r bg-neutral-50 px-4 py-3 text-left text-xs font-semibold tracking-wide text-neutral-300 uppercase">
                  Completion
                </th>
                {courses.map((course) => {
                  const totals = totalsByCourse.get(course.course_id);
                  return (
                    <td key={course.course_id} className="px-3 py-3 text-center text-xs">
                      <span className="font-semibold text-neutral-900">
                        {totals?.completion_rate ?? 0}%
                      </span>
                      <span className="block text-neutral-300">
                        {totals?.completed ?? 0} / {totals?.enrolled ?? 0}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="text-xs text-neutral-300">
        A completed enrolment scoring below the passing mark shows as failed. Learners with no
        enrolment for a course have no cell.
      </p>
    </div>
  );
}
