"use client";

import { useMemo, useState } from "react";
import { KeyRound, Layers, PackageCheck, UserPlus } from "lucide-react";
import { AssignCourseModal } from "@/components/business/assign-course-modal";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { KpiCard } from "@/components/business/kpi-card";
import { StatusBadge } from "@/components/business/status-badge";
import { UsageBar } from "@/components/business/usage-bar";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { Button } from "@/components/ui/button";
import { useBusinessLicenceBalance } from "@/lib/hooks/useBusinessDashboard";
import type { LicencePool } from "@/types/business-dashboard";

export default function BusinessAvailableCoursesPage() {
  const { data, isLoading, isError } = useBusinessLicenceBalance();
  const [assignTarget, setAssignTarget] = useState<LicencePool | null>(null);

  const pools = data?.pools ?? [];

  const totals = useMemo(() => {
    return pools.reduce(
      (acc, p) => {
        acc.quantity += p.quantity ?? 0;
        acc.used += p.used ?? 0;
        acc.available += p.available ?? 0;
        return acc;
      },
      { quantity: 0, used: 0, available: 0 },
    );
  }, [pools]);

  const columns: Column<LicencePool>[] = [
    {
      key: "course",
      header: "Course",
      cell: (row) => <span className="font-medium text-neutral-900">{row.course_name}</span>,
    },
    {
      key: "available",
      header: "Available",
      cell: (row) => <StatusBadge status={row.available > 0 ? "available" : "expired"} />,
    },
    {
      key: "usage",
      header: "Usage",
      className: "min-w-[160px]",
      cell: (row) => <UsageBar used={row.used} total={row.quantity} showLabel />,
    },
    { key: "pool", header: "Pool", cell: (row) => `${row.used} / ${row.quantity}` },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions",
      header: "",
      cell: (row) =>
        row.available > 0 ? (
          <Button size="sm" variant="outline" onClick={() => setAssignTarget(row)}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Assign
          </Button>
        ) : (
          <span className="text-neutral-300">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Available Courses"
        description="Course licences in your pool, ready to assign to learners."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Courses with Licences" value={pools.length} icon={Layers} tone="primary" />
        <KpiCard
          label="Licences Available"
          value={totals.available}
          icon={PackageCheck}
          tone="success"
        />
        <KpiCard
          label="Used / Total"
          value={`${totals.used} / ${totals.quantity}`}
          icon={KeyRound}
          tone="amber"
        />
      </div>

      <BusinessDataTable<LicencePool>
        columns={columns}
        rows={pools}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No licences yet"
        emptyDescription="Purchased course licences will appear here."
      />

      <AssignCourseModal
        courseId={assignTarget?.course_id ?? null}
        courseName={assignTarget?.course_name ?? ""}
        open={assignTarget != null}
        onOpenChange={(open) => !open && setAssignTarget(null)}
      />
    </div>
  );
}
