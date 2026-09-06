"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { StatusBadge } from "@/components/business/status-badge";
import { UsageBar } from "@/components/business/usage-bar";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { Button } from "@/components/ui/button";
import { LearnerOptionsRail } from "@/components/business/learner-options-rail";
import { useBusinessLearner, useBusinessLearnerCourses } from "@/lib/hooks/useBusinessDashboard";
import { deriveLearnerStatus } from "@/lib/utils/business-learners";
import type { LearnerCourseItem } from "@/types/business-dashboard";
import { formatBusinessDate } from "@/lib/utils/business-dates";

/** Wire-style status keys, so StatusBadge picks up the right colour. */
function progressStatus(progress?: number): string {
  const p = progress ?? 0;
  if (p >= 100) return "completed";
  if (p > 0) return "in_progress";
  return "not_started";
}

export default function BusinessLearnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const learnerId = Number(id);
  const { data: learner, isLoading, isError } = useBusinessLearner(learnerId);
  const { data: coursesData, isLoading: coursesLoading } = useBusinessLearnerCourses(learnerId);

  const courses = coursesData?.items ?? [];

  const columns: Column<LearnerCourseItem>[] = [
    { key: "course", header: "Course", cell: (row) => row.course_name },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={progressStatus(row.progress)} />,
    },
    {
      key: "progress",
      header: "Progress",
      className: "min-w-[120px]",
      cell: (row) => <UsageBar used={row.progress ?? 0} total={100} color="bg-[#3F576F]" />,
    },
    { key: "start", header: "Start", cell: (row) => formatBusinessDate(row.start_date) },
    {
      key: "completion",
      header: "Completed",
      cell: (row) => formatBusinessDate(row.completion_date),
    },
    {
      key: "cert",
      header: "Certificate",
      cell: (row) =>
        row.certificate_url ? (
          <a
            href={row.certificate_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#3F576F] hover:underline"
          >
            View
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Learner Details"
        actions={
          <Button asChild variant="outline">
            <Link href="/business-dashboard/learners">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to learners
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="border-neutral-30 h-40 animate-pulse rounded-xl border bg-white" />
      ) : isError || !learner ? (
        <div className="border-neutral-30 rounded-xl border bg-white p-10 text-center text-sm text-red-600">
          Could not load this learner.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="border-neutral-30 rounded-xl border bg-white p-6 shadow-xs">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3F576F]/10 text-xl font-bold text-[#3F576F]">
                  {(learner.display_name || "?").charAt(0).toUpperCase()}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">{learner.display_name}</h2>
                  <p className="flex items-center gap-1.5 text-sm text-neutral-300">
                    <Mail className="h-4 w-4" />
                    {learner.email || "—"}
                  </p>
                </div>
                <StatusBadge status={deriveLearnerStatus(learner)} className="ml-auto" />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-neutral-900">Assigned courses</h3>
              <BusinessDataTable<LearnerCourseItem>
                columns={columns}
                rows={courses}
                rowKey={(row) => row.course_id}
                isLoading={coursesLoading}
                emptyTitle="No courses assigned"
                emptyDescription="Courses assigned to this learner will appear here."
              />
            </div>
          </div>

          <LearnerOptionsRail learner={learner} />
        </div>
      )}
    </div>
  );
}
