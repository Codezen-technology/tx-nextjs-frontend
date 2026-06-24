"use client";

import { BusinessPageHeader } from "@/components/business/business-page-header";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { StatusBadge } from "@/components/business/status-badge";
import { useBusinessManagers, useBusinessProfile } from "@/lib/hooks/useBusinessDashboard";
import type { BusinessManager } from "@/types/business-dashboard";

export default function BusinessManagersPage() {
  const { data: business } = useBusinessProfile();
  const { data, isLoading, isError } = useBusinessManagers(business?.id ?? null);

  const rows = data?.items ?? data?.managers ?? [];

  const columns: Column<BusinessManager>[] = [
    { key: "name", header: "Name", cell: (r) => r.display_name },
    { key: "email", header: "Email", cell: (r) => r.email },
    { key: "role", header: "Role", cell: (r) => r.role ?? "manager" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Business Management"
        description="Managers who can help administer your business account."
      />

      <BusinessDataTable<BusinessManager>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No managers"
        emptyDescription="Business managers will appear here."
      />
    </div>
  );
}
