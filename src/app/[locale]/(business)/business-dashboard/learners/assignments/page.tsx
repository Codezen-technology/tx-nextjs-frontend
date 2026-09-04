"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { AssignmentFundingBadge } from "@/components/business/assignment-funding-badge";
import { StatusBadge } from "@/components/business/status-badge";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBusinessAssignments, useRevokeLicence } from "@/lib/hooks/useBusinessDashboard";
import type { CourseAssignment } from "@/types/business-dashboard";

const PER_PAGE = 10;
const STATUS_OPTIONS = ["all", "active", "completed", "expired"] as const;

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function BusinessAssignmentHistoryPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [confirmingRevoke, setConfirmingRevoke] = useState<number | null>(null);
  const [revokeError, setRevokeError] = useState("");

  const revoke = useRevokeLicence();

  const { data, isLoading, isError } = useBusinessAssignments({
    page,
    per_page: PER_PAGE,
    search,
    status: status === "all" ? undefined : status,
  });

  const totalPages = data?.total_pages ?? 1;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const columns: Column<CourseAssignment>[] = [
    { key: "learner", header: "Learner", cell: (row) => row.user_name },
    { key: "course", header: "Course", cell: (row) => row.course_name },
    {
      key: "funding",
      header: "Funding",
      cell: (row) => <AssignmentFundingBadge assignmentType={row.assignment_type} />,
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { key: "date", header: "Assigned", cell: (row) => formatDate(row.created_at) },
    {
      key: "actions",
      header: "",
      className: "text-right",
      // A licence spent on the wrong learner was unrecoverable through the UI
      // until POST /licences/revoke existed. Only licence-funded, still-active
      // assignments hold a seat worth reclaiming.
      cell: (row) => {
        if (row.assignment_type !== "licence" || row.status !== "active") return null;

        if (confirmingRevoke === row.id) {
          return (
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={revoke.isPending}
                onClick={async () => {
                  setRevokeError("");
                  try {
                    await revoke.mutateAsync(row.id);
                  } catch {
                    setRevokeError(`Could not revoke ${row.user_name}'s licence.`);
                  } finally {
                    setConfirmingRevoke(null);
                  }
                }}
              >
                Confirm
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmingRevoke(null)}>
                Cancel
              </Button>
            </div>
          );
        }

        return (
          <Button
            size="sm"
            variant="outline"
            disabled={revoke.isPending}
            onClick={() => setConfirmingRevoke(row.id)}
          >
            Revoke
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Assignment History"
        description="A complete log of course assignments across your team. Revoking returns the licence to its pool."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={onSearch} className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-300" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search assignments..."
            className="pl-9"
          />
        </form>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="border-neutral-40 h-10 rounded-md border bg-white px-3 text-sm text-neutral-700 capitalize outline-hidden focus:border-[#3F576F]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "all" ? "All statuses" : opt}
            </option>
          ))}
        </select>
      </div>

      {revokeError ? <p className="text-sm text-red-600">{revokeError}</p> : null}

      <BusinessDataTable<CourseAssignment>
        columns={columns}
        rows={data?.assignments}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No assignments found"
        emptyDescription="Try changing your search or status filter."
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
