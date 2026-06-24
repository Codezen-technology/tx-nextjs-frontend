"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { StatusBadge } from "@/components/business/status-badge";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { Input } from "@/components/ui/input";
import { useBusinessLearners } from "@/lib/hooks/useBusinessDashboard";
import type { Learner } from "@/types/business-dashboard";

const PER_PAGE = 10;

export default function BusinessLearnersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useBusinessLearners({ page, per_page: PER_PAGE, search });

  const totalPages = data?.meta?.pages ?? 1;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const columns: Column<Learner>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <Link
          href={`/business-dashboard/learners/${row.id}`}
          className="font-medium text-[#3F576F] hover:underline"
        >
          {row.display_name || "—"}
        </Link>
      ),
    },
    { key: "email", header: "Email", cell: (row) => row.email || row.user_email || "—" },
    { key: "role", header: "Role", cell: (row) => <StatusBadge status={row.role} /> },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Learners"
        description="Everyone on your team and their current status."
      />

      <form onSubmit={onSearch} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-300" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search learners..."
          className="pl-9"
        />
      </form>

      <BusinessDataTable<Learner>
        columns={columns}
        rows={data?.members}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No learners found"
        emptyDescription="Learners added to your business will appear here."
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {!isLoading && !data?.members?.length && (
        <div className="flex items-center gap-2 text-sm text-neutral-300">
          <Users className="h-4 w-4" />
          Tip: learners are managed from your WordPress business dashboard.
        </div>
      )}
    </div>
  );
}
