"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Award, KeyRound, TrendingUp, Users } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { AssignmentFundingBadge } from "@/components/business/assignment-funding-badge";
import { AssignCourseModal } from "@/components/business/assign-course-modal";
import { CourseStatusTable } from "@/components/business/overview/course-status-table";
import { KpiCard } from "@/components/business/kpi-card";
import { StatusBadge } from "@/components/business/status-badge";
import { UsageBar } from "@/components/business/usage-bar";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { Button } from "@/components/ui/button";
import {
  useBusinessActiveSubscription,
  useBusinessAssignmentList,
  useBusinessAssignments,
  useBusinessLearners,
  useBusinessLicenceBalance,
  useBusinessSummary,
} from "@/lib/hooks/useBusinessDashboard";
import { partitionLearners } from "@/lib/utils/business-learners";
import { sumAvailableLicences, sumLicenceTotals } from "@/lib/utils/business-licences";
import type { AssignmentListCourse, CourseAssignment } from "@/types/business-dashboard";

/** The facade caps per_page at 100, so the partition can only see one page. */
const PARTITION_SAMPLE = 100;
const COURSE_PAGE_SIZE = 10;

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
}

export default function BusinessOverviewPage() {
  const [coursePage, setCoursePage] = useState(1);
  const [assignTarget, setAssignTarget] = useState<AssignmentListCourse | null>(null);

  const { data: summary } = useBusinessSummary();
  const { data: licenceBalance } = useBusinessLicenceBalance();
  const { data: activeSubscription } = useBusinessActiveSubscription();
  const recent = useBusinessAssignments({ page: 1, per_page: 5 });
  const team = useBusinessLearners({ page: 1, per_page: PARTITION_SAMPLE, status: "all" });
  const assignmentSample = useBusinessAssignments({ page: 1, per_page: PARTITION_SAMPLE });
  const courseList = useBusinessAssignmentList({ page: coursePage, per_page: COURSE_PAGE_SIZE });

  const pools = licenceBalance?.pools ?? [];
  const availableLicences = sumAvailableLicences(pools);
  const licenceTotals = sumLicenceTotals(pools);

  const active = summary?.total_active ?? 0;
  const completed = summary?.total_completed ?? 0;
  const assignmentTotal = active + completed;
  const completionRate = assignmentTotal > 0 ? Math.round((completed / assignmentTotal) * 100) : 0;

  const courses = useMemo(
    () => courseList.data?.items ?? courseList.data?.courses ?? [],
    [courseList.data],
  );

  /**
   * Enrolled / unassigned / pending / archived, computed client-side from one
   * page of the team and one page of assignments.
   *
   * Both are capped at 100 rows, so the split is only correct while the whole
   * organisation fits in a single page. Past that it is suppressed rather than
   * shown wrong — the honest fix is `GET /team/stats` on the backend
   * (docs/B2B_API_GAPS.md cluster 6).
   */
  const teamTotal = team.data?.meta?.total ?? 0;
  const assignmentRowTotal = Number(assignmentSample.data?.total ?? 0);
  const partitionIsComplete =
    !team.isLoading &&
    !assignmentSample.isLoading &&
    teamTotal > 0 &&
    teamTotal <= PARTITION_SAMPLE &&
    assignmentRowTotal <= PARTITION_SAMPLE;

  const partition = useMemo(() => {
    const learners = team.data?.members ?? [];
    const assigned = new Set(
      (assignmentSample.data?.assignments ?? []).map((a: CourseAssignment) => a.user_id),
    );
    return partitionLearners(learners, assigned);
  }, [team.data, assignmentSample.data]);

  const columns: Column<CourseAssignment>[] = [
    {
      key: "learner",
      header: "Learner",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3F576F]/10 text-xs font-semibold text-[#3F576F]">
            {(row.user_name || "?").charAt(0).toUpperCase()}
          </span>
          <span className="font-medium text-neutral-900">{row.user_name}</span>
        </div>
      ),
    },
    { key: "course", header: "Course", cell: (row) => row.course_name },
    {
      key: "funding",
      header: "Funding",
      cell: (row) => <AssignmentFundingBadge assignmentType={row.assignment_type} />,
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { key: "date", header: "Date", cell: (row) => formatDate(row.created_at) },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Summary"
        description="An overview of your team's learning activity."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/business-dashboard/pricing">Need more licences</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/business-dashboard/learners/add">Add learner</Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Training progress"
          value={`${completionRate}%`}
          icon={TrendingUp}
          tone="primary"
          hint={`${completed} complete · ${active} in progress`}
        />
        <KpiCard
          label="Team overview"
          value={summary?.total_members ?? teamTotal}
          icon={Users}
          tone="success"
          hint={
            partitionIsComplete
              ? `${partition.enrolled} enrolled · ${partition.unassigned} unassigned · ${partition.pending} pending`
              : "Across your organisation"
          }
        />
        <KpiCard
          label="Digital certificates"
          value={summary?.total_certificates ?? 0}
          icon={Award}
          tone="warning"
          hint="Issued to your learners"
        />
        <KpiCard
          label="Licence usage"
          value={`${licenceTotals.used} / ${licenceTotals.quantity}`}
          icon={KeyRound}
          tone="amber"
          hint={
            activeSubscription?.next_payment
              ? `Renews ${formatDate(activeSubscription.next_payment)}`
              : `${availableLicences} available`
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border-neutral-30 rounded-xl border bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Licence usage</h3>
            <Link
              href="/business-dashboard/licences"
              className="text-sm font-medium text-[#3F576F] hover:underline"
            >
              Manage plan
            </Link>
          </div>
          <div className="space-y-3">
            <UsageBar
              used={licenceTotals.used}
              total={licenceTotals.quantity || 1}
              color="bg-[#3F576F]"
            />
            <div className="flex justify-between text-xs text-neutral-300">
              <span>Used: {licenceTotals.used}</span>
              <span>Total purchased: {licenceTotals.quantity}</span>
            </div>
          </div>
        </div>

        <div className="border-neutral-30 rounded-xl border bg-white p-6 shadow-xs">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900">Course assignment status</h3>
          <div className="space-y-4">
            {[
              { label: "Active", count: active, color: "bg-emerald-500" },
              { label: "Completed", count: completed, color: "bg-[#3F576F]" },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-300">{item.label}</span>
                  <span className="font-medium text-neutral-900">{item.count}</span>
                </div>
                <UsageBar used={item.count} total={assignmentTotal || 1} color={item.color} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">Course status overview</h3>
          <Link
            href="/business-dashboard/courses"
            className="text-sm font-medium text-[#3F576F] hover:underline"
          >
            See all
          </Link>
        </div>
        <CourseStatusTable
          courses={courses}
          isLoading={courseList.isLoading}
          isError={courseList.isError}
          onAssign={setAssignTarget}
          page={coursePage}
          totalPages={courseList.data?.pages ?? 1}
          onPageChange={setCoursePage}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-neutral-900">Recent course assignments</h3>
        <BusinessDataTable<CourseAssignment>
          columns={columns}
          rows={recent.data?.assignments?.slice(0, 5)}
          rowKey={(row) => row.id}
          isLoading={recent.isLoading}
          isError={recent.isError}
          emptyTitle="No assignments yet"
          emptyDescription="Course assignments to your learners will appear here."
        />
      </div>

      <AssignCourseModal
        courseId={assignTarget?.course_id ?? null}
        courseName={assignTarget?.course_name ?? ""}
        open={assignTarget != null}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null);
        }}
      />
    </div>
  );
}
