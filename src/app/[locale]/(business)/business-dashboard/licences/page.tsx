"use client";

import { useMemo, useState } from "react";
import { KeyRound, Layers, PackageCheck, PoundSterling, Search } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { KpiCard } from "@/components/business/kpi-card";
import { StatusBadge } from "@/components/business/status-badge";
import { UsageBar } from "@/components/business/usage-bar";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { Input } from "@/components/ui/input";
import { useBusinessLicenceBalance } from "@/lib/hooks/useBusinessDashboard";
import { formatPoolCourseName, isMigratedCreditPool } from "@/lib/utils/business-licences";
import type { LicencePool } from "@/types/business-dashboard";

const STATUS_OPTIONS = ["all", "active", "inactive"] as const;

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
}

function formatCurrency(value?: number) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
}

export default function BusinessLicenceHistoryPage() {
  const { data, isLoading, isError } = useBusinessLicenceBalance();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("all");

  const pools = data?.pools ?? [];

  const filtered = useMemo(() => {
    return pools.filter((pool) => {
      const matchesSearch =
        !search || formatPoolCourseName(pool).toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "all" || pool.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [pools, search, status]);

  const totals = useMemo(() => {
    return pools.reduce(
      (acc, p) => {
        acc.quantity += p.quantity ?? 0;
        acc.used += p.used ?? 0;
        acc.spend += (p.quantity ?? 0) * (p.price_per_licence ?? 0);
        return acc;
      },
      { quantity: 0, used: 0, spend: 0 },
    );
  }, [pools]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const columns: Column<LicencePool>[] = [
    {
      key: "course",
      header: "Course",
      cell: (row) => (
        <div>
          <span className="font-medium text-neutral-900">{formatPoolCourseName(row)}</span>
          {isMigratedCreditPool(row) ? (
            <span className="mt-0.5 block text-xs text-neutral-400">Migrated from credits</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "order",
      header: "Order",
      cell: (row) => (row.order_id ? `#${row.order_id}` : "—"),
    },
    { key: "date", header: "Date", cell: (row) => formatDate(row.created_at) },
    { key: "qty", header: "Qty", cell: (row) => row.quantity },
    {
      key: "usage",
      header: "Usage",
      className: "min-w-[160px]",
      cell: (row) => <UsageBar used={row.used} total={row.quantity} showLabel />,
    },
    {
      key: "price",
      header: "Price / Licence",
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span>{formatCurrency(row.price_per_licence)}</span>
          {row.discount_percent > 0 ? (
            <span className="text-xs text-emerald-600">-{row.discount_percent}%</span>
          ) : null}
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Licence History"
        description="A record of course licence pools purchased for your business."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Pools" value={pools.length} icon={Layers} tone="primary" />
        <KpiCard label="Total Licences" value={totals.quantity} icon={KeyRound} tone="amber" />
        <KpiCard label="Used" value={totals.used} icon={PackageCheck} tone="success" />
        <KpiCard
          label="Total Spend"
          value={formatCurrency(totals.spend)}
          icon={PoundSterling}
          tone="warning"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={onSearch} className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-300" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by course name..."
            className="pl-9"
          />
        </form>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}
          className="h-10 rounded-md border border-neutral-40 bg-white px-3 text-sm capitalize text-neutral-700 outline-none focus:border-[#3F576F]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "all" ? "All statuses" : opt}
            </option>
          ))}
        </select>
      </div>

      <BusinessDataTable<LicencePool>
        columns={columns}
        rows={filtered}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No licence pools found"
        emptyDescription="Purchased course licences will appear here."
      />
    </div>
  );
}
