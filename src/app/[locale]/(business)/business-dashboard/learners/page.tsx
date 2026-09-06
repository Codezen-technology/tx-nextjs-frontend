"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Search, UserPlus, Users } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { StatusBadge } from "@/components/business/status-badge";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useBusinessLearners,
  useConvertBusinessLearnerRole,
  useDepartments,
  useUpdateBusinessLearner,
} from "@/lib/hooks/useBusinessDashboard";
import { deriveLearnerStatus } from "@/lib/utils/business-learners";
import type { Learner } from "@/types/business-dashboard";
import { formatBusinessDate } from "@/lib/utils/business-dates";

const PER_PAGE_OPTIONS = [10, 25, 50];

export default function BusinessLearnersPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [departmentId, setDepartmentId] = useState("");

  const { data: departments } = useDepartments();

  const { data, isLoading, isError } = useBusinessLearners({
    page,
    per_page: perPage,
    search,
    // The facade defaults to `all`; asking for `active` is what hides archived rows.
    status: showArchived ? "all" : "active",
    department_id: departmentId ? Number(departmentId) : undefined,
  });
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
    { key: "email", header: "Email", cell: (row) => row.email || "—" },
    { key: "role", header: "Role", cell: (row) => <StatusBadge status={row.role} /> },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={deriveLearnerStatus(row)} />,
    },
    { key: "created", header: "Added", cell: (row) => formatBusinessDate(row.created_at) },
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
            {row.status !== "inactive" ? (
              <DropdownMenuItem
                onClick={() => updateLearner.mutate({ id: row.id, status: "inactive" })}
              >
                Archive
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => updateLearner.mutate({ id: row.id, status: "active" })}
              >
                Restore
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={onSearch} className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-300" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search learners..."
            className="pl-9"
          />
        </form>

        <div className="flex flex-wrap items-center gap-4">
          {departments?.flat.length ? (
            <select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by department"
              className="border-neutral-30 h-9 rounded-lg border bg-white px-2 text-sm text-neutral-900"
            >
              <option value="">All departments</option>
              {departments.flat.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : null}

          <Label className="flex items-center gap-2 text-sm font-normal text-neutral-700">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => {
                setShowArchived(e.target.checked);
                setPage(1);
              }}
              className="border-neutral-30 h-4 w-4 rounded accent-[#3F576F]"
            />
            Show archived learners
          </Label>

          <label className="flex items-center gap-2 text-sm text-neutral-300">
            Per page
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="border-neutral-30 h-9 rounded-lg border bg-white px-2 text-sm text-neutral-900"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

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
