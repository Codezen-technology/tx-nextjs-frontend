"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { Input } from "@/components/ui/input";
import { useBusinessAssignmentList } from "@/lib/hooks/useBusinessDashboard";
import type { AssignmentListCourse } from "@/types/business-dashboard";

const PER_PAGE = 10;

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
}

function assignmentRows(data: ReturnType<typeof useBusinessAssignmentList>["data"]) {
  return data?.items ?? data?.courses ?? [];
}

export default function BusinessCertificatesPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useBusinessAssignmentList({
    page,
    per_page: PER_PAGE,
    search,
  });

  const rows = assignmentRows(data);
  const totalPages = data?.pages ?? 1;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const columns: Column<AssignmentListCourse>[] = [
    {
      key: "course",
      header: "Course",
      cell: (row) => (
        <Link
          href={`/business-dashboard/certificates/${row.course_id}`}
          className="font-medium text-[#3F576F] hover:underline"
        >
          {row.course_name}
        </Link>
      ),
    },
    { key: "first", header: "First Assigned", cell: (row) => formatDate(row.first_assigned) },
    { key: "last", header: "Last Assigned", cell: (row) => formatDate(row.last_assigned) },
    { key: "learners", header: "Total Learners", cell: (row) => row.total_learners ?? "—" },
    {
      key: "issued",
      header: "Certificates Issued",
      cell: (row) => row.completion_stats?.certificate_count ?? "—",
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Link
          href={`/business-dashboard/certificates/${row.course_id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#3F576F] hover:underline"
        >
          View learners
          <ChevronRight className="h-4 w-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Certificates"
        description="Courses with learner certificate status. Drill down to see individual progress."
      />

      <form onSubmit={onSearch} className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-300" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search courses..."
          className="pl-9"
        />
      </form>

      <BusinessDataTable<AssignmentListCourse>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.course_id}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No certificate data"
        emptyDescription="Courses with assigned learners will appear here."
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
