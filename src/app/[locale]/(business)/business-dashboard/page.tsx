"use client";

import { Award, BookOpen, Coins, Users } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { KpiCard } from "@/components/business/kpi-card";
import { StatusBadge } from "@/components/business/status-badge";
import { UsageBar } from "@/components/business/usage-bar";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import {
  useBusinessAssignments,
  useBusinessCreditBalance,
  useBusinessSummary,
} from "@/lib/hooks/useBusinessDashboard";
import type { CourseAssignment } from "@/types/business-dashboard";

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function BusinessOverviewPage() {
  const { data: summary } = useBusinessSummary();
  const { data: credit } = useBusinessCreditBalance();
  const recent = useBusinessAssignments({ page: 1, per_page: 5 });

  const active = summary?.total_active ?? 0;
  const completed = summary?.total_completed ?? 0;
  const assignmentTotal = active + completed;

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
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { key: "date", header: "Date", cell: (row) => formatDate(row.created_at) },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Summary"
        description="An overview of your team's learning activity."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Available Credits" value={credit?.balance ?? 0} icon={Coins} tone="amber" />
        <KpiCard
          label="Active Courses"
          value={summary?.total_courses ?? 0}
          icon={BookOpen}
          tone="primary"
        />
        <KpiCard
          label="Assigned Learners"
          value={summary?.total_members ?? 0}
          icon={Users}
          tone="success"
        />
        <KpiCard
          label="Certificates Issued"
          value={summary?.total_certificates ?? 0}
          icon={Award}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-30 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900">Credit Usage Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-300">Available Credits</span>
              <span className="font-medium text-neutral-900">{credit?.balance ?? 0}</span>
            </div>
            <UsageBar
              used={assignmentTotal}
              total={assignmentTotal + (credit?.balance ?? 0)}
              color="bg-[#3F576F]"
            />
            <div className="flex justify-between text-xs text-neutral-300">
              <span>Used: {assignmentTotal}</span>
              <span>Available: {credit?.balance ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-30 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900">Course Assignment Status</h3>
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
        <h3 className="text-lg font-semibold text-neutral-900">Recent Course Assignments</h3>
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
    </div>
  );
}
