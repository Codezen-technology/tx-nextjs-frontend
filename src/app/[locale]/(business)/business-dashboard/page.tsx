"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Award, BellRing, KeyRound, TrendingUp, Users } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { AssignmentFundingBadge } from "@/components/business/assignment-funding-badge";
import { AssignCourseModal } from "@/components/business/assign-course-modal";
import { ActivityFeed } from "@/components/business/overview/activity-feed";
import { CourseStatusTable } from "@/components/business/overview/course-status-table";
import { KpiCard } from "@/components/business/kpi-card";
import { StatusBadge } from "@/components/business/status-badge";
import { UsageBar } from "@/components/business/usage-bar";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import {
  useBusinessActiveSubscription,
  useBusinessAssignmentList,
  useBusinessAssignments,
  useBusinessLicenceBalance,
  useBusinessSummary,
  useRemindBehind,
  useTeamStats,
} from "@/lib/hooks/useBusinessDashboard";
import { sumAvailableLicences, sumLicenceTotals } from "@/lib/utils/business-licences";
import type { AssignmentListCourse, CourseAssignment } from "@/types/business-dashboard";

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
  const { data: teamStats } = useTeamStats();
  const remindBehind = useRemindBehind();
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

  const [remindMessage, setRemindMessage] = useState("");

  /**
   * Fire the server-side sweep and report honestly.
   *
   * `learners` is the population selected, not the successes, so zero means
   * nobody was behind — a different outcome from every mail failing, and the
   * one distinction a manager actually needs.
   */
  const onRemindAll = async () => {
    setRemindMessage("");
    try {
      const result = await remindBehind.mutateAsync({});

      if (result.learners === 0) {
        setRemindMessage("Nobody is behind right now — no reminders sent.");
      } else if (result.sent === 0) {
        setRemindMessage(`No reminders could be sent to ${result.learners} learners.`);
      } else if (result.failed > 0) {
        setRemindMessage(`Reminded ${result.sent} learners; ${result.failed} could not be sent.`);
      } else {
        setRemindMessage(
          `Reminded ${result.sent} learner${result.sent === 1 ? "" : "s"} across ${result.courses} course${result.courses === 1 ? "" : "s"}.`,
        );
      }
    } catch (err) {
      // The sweep is rate limited to one run per business per five minutes.
      setRemindMessage(
        err instanceof ApiError && err.status === 429
          ? "Reminders were sent recently. Try again in a few minutes."
          : "Could not send reminders. Please try again.",
      );
    }
  };

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
            <Button
              size="sm"
              variant="outline"
              disabled={remindBehind.isPending}
              onClick={onRemindAll}
            >
              <BellRing className="mr-2 h-4 w-4" />
              {remindBehind.isPending ? "Sending…" : "Remind all behind"}
            </Button>
            <Button asChild size="sm">
              <Link href="/business-dashboard/learners/add">Add learner</Link>
            </Button>
          </>
        }
      />

      {remindMessage ? (
        <p className="rounded-lg bg-[#3F576F]/5 px-4 py-3 text-sm text-[#3F576F]">
          {remindMessage}
        </p>
      ) : null}

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
          value={teamStats?.total ?? summary?.total_members ?? 0}
          icon={Users}
          tone="success"
          hint={
            teamStats
              ? `${teamStats.enrolled} enrolled · ${teamStats.unassigned} unassigned · ${teamStats.pending} pending`
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">Recent activity</h3>
          <Link
            href="/business-dashboard/analytics/reports"
            className="text-sm font-medium text-[#3F576F] hover:underline"
          >
            See all
          </Link>
        </div>
        <ActivityFeed />
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
