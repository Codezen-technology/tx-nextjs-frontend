"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Search, UserPlus, Users } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { StatusBadge } from "@/components/business/status-badge";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useBusinessLearners,
  useConvertBusinessLearnerRole,
  useUpdateBusinessLearner,
} from "@/lib/hooks/useBusinessDashboard";
import type { Learner } from "@/types/business-dashboard";

const PER_PAGE = 10;

export default function BusinessLearnersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useBusinessLearners({ page, per_page: PER_PAGE, search });
  const updateLearner = useUpdateBusinessLearner();
  const convertRole = useConvertBusinessLearnerRole();

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
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="hover:bg-neutral-10 rounded p-1" aria-label="Actions">
              <MoreHorizontal className="h-4 w-4 text-neutral-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {row.status === "active" ? (
              <DropdownMenuItem
                onClick={() => updateLearner.mutate({ id: row.id, status: "inactive" })}
              >
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => updateLearner.mutate({ id: row.id, status: "active" })}
              >
                Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() =>
                convertRole.mutate({
                  id: row.id,
                  role: row.role === "manager" ? "learner" : "manager",
                })
              }
            >
              {row.role === "manager" ? "Convert to learner" : "Convert to manager"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Learners"
        description="Everyone on your team and their current status."
        actions={
          <Button asChild className="bg-[#3F576F] hover:bg-[#33485d]">
            <Link href="/business-dashboard/learners/add">
              <UserPlus className="mr-2 h-4 w-4" />
              Add learner
            </Link>
          </Button>
        }
      />

      <form onSubmit={onSearch} className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-300" />
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
          Add learners from the button above to grow your team.
        </div>
      )}
    </div>
  );
}
