"use client";

import { Users } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { KpiCard } from "@/components/business/kpi-card";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { StatusBadge } from "@/components/business/status-badge";
import {
  useBusinessSubscriptionAssigned,
  useBusinessSubscriptionSummary,
} from "@/lib/hooks/useBusinessDashboard";
import type { AssignedSubscription } from "@/types/business-dashboard";

export default function BusinessSubscriptionsPage() {
  const { data: summary, isLoading: summaryLoading } = useBusinessSubscriptionSummary();
  const { data: assigned, isLoading: assignedLoading } = useBusinessSubscriptionAssigned({
    page: 1,
    per_page: 20,
  });

  const rows = assigned?.items ?? [];
  const columns: Column<AssignedSubscription>[] = [
    { key: "name", header: "Member", cell: (r) => r.user_name ?? "—" },
    { key: "email", header: "Email", cell: (r) => r.user_email ?? "—" },
    { key: "plan", header: "Plan", cell: (r) => r.plan_name ?? "—" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Subscription Management"
        description="Overview of subscription seats assigned to your team."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total Seats"
          value={summaryLoading ? "—" : (summary?.total_seats ?? 0)}
          icon={Users}
          tone="primary"
        />
        <KpiCard
          label="Used"
          value={summaryLoading ? "—" : (summary?.used_seats ?? 0)}
          icon={Users}
          tone="amber"
        />
        <KpiCard
          label="Available"
          value={summaryLoading ? "—" : (summary?.available_seats ?? 0)}
          icon={Users}
          tone="success"
        />
      </div>

      <BusinessDataTable<AssignedSubscription>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        isLoading={assignedLoading}
        emptyTitle="No assigned subscriptions"
        emptyDescription="Learners with an active subscription seat will appear here."
      />
    </div>
  );
}
