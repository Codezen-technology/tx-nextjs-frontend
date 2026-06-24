"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { StatusBadge } from "@/components/business/status-badge";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { Input } from "@/components/ui/input";
import { useBusinessAssignments } from "@/lib/hooks/useBusinessDashboard";
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
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { key: "date", header: "Assigned", cell: (row) => formatDate(row.created_at) },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Assignment History"
        description="A complete log of course assignments across your team."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={onSearch} className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-300" />
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
          className="h-10 rounded-md border border-neutral-40 bg-white px-3 text-sm capitalize text-neutral-700 outline-none focus:border-[#3F576F]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "all" ? "All statuses" : opt}
            </option>
          ))}
        </select>
      </div>

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
