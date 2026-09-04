"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { StatusBadge } from "@/components/business/status-badge";
import { Input } from "@/components/ui/input";
import { useSeatRoster } from "@/lib/hooks/useBusinessDashboard";
import type { SeatRosterRow } from "@/types/business-dashboard";

const PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All seats" },
  { value: "assigned", label: "Assigned" },
  { value: "available", label: "Available" },
  { value: "suspended", label: "Suspended" },
  { value: "revoked", label: "Revoked" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
}

/**
 * Every seated learner across all of the business's subscriptions.
 *
 * The per-subscription seats endpoint cannot answer this without one call per
 * subscription, which is why the backend added `/seat-roster`.
 */
export function SeatRosterTable() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading, isError } = useSeatRoster({
    page,
    per_page: PER_PAGE,
    search,
    status,
  });

  const columns: Column<SeatRosterRow>[] = [
    {
      key: "learner",
      header: "Learner",
      cell: (row) =>
        row.user_name ? (
          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-900">{row.user_name}</p>
            <p className="truncate text-xs text-neutral-300">{row.user_email}</p>
          </div>
        ) : (
          <span className="text-neutral-300">Unassigned seat</span>
        ),
    },
    { key: "plan", header: "Plan", cell: (row) => row.plan_type ?? "—" },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { key: "assigned", header: "Assigned", cell: (row) => formatDate(row.assigned_at) },
    { key: "subscription", header: "Subscription", cell: (row) => `#${row.subscription_id}` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
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

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Filter seats by status"
          className="border-neutral-30 h-9 rounded-lg border bg-white px-2 text-sm text-neutral-900"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <BusinessDataTable<SeatRosterRow>
        columns={columns}
        rows={data?.items}
        rowKey={(row) => row.seat_id}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No seats match"
        emptyDescription="Seats appear here once a subscription is purchased."
        page={page}
        totalPages={data?.pages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
