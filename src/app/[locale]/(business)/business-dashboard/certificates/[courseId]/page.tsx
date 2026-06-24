"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Search } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { StatusBadge } from "@/components/business/status-badge";
import { UsageBar } from "@/components/business/usage-bar";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBusinessCourseLearners } from "@/lib/hooks/useBusinessDashboard";
import type { Learner } from "@/types/business-dashboard";

const PER_PAGE = 10;

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
}

function progressLabel(progress?: number): string {
  const p = progress ?? 0;
  if (p >= 100) return "Passed";
  if (p > 0) return "In Progress";
  return "Not Started";
}

export default function BusinessCourseCertificatesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const id = Number(courseId);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useBusinessCourseLearners(id, {
    page,
    per_page: PER_PAGE,
    search,
  });

  const rows = data?.items ?? data?.learners ?? data?.members ?? [];
  const totalPages = data?.pages ?? 1;
  const courseName = data?.course_info?.post_title ?? "Course";

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
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{row.display_name}</p>
          <p className="truncate text-xs text-neutral-300">{row.email || row.user_email}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={progressLabel(row.progress)} />,
    },
    {
      key: "progress",
      header: "Progress",
      className: "min-w-[140px]",
      cell: (row) => (
        <div className="space-y-1">
          <UsageBar used={row.progress ?? 0} total={100} color="bg-[#3F576F]" />
          <span className="text-xs text-neutral-300">{row.progress ?? 0}%</span>
        </div>
      ),
    },
    { key: "start", header: "Start Date", cell: (row) => formatDate(row.start_date) },
    { key: "completion", header: "Completion", cell: (row) => formatDate(row.completion_date) },
    {
      key: "score",
      header: "Score",
      cell: (row) => {
        const pct = row.quiz_scores?.percentage;
        return pct != null ? `${pct}%` : "—";
      },
    },
    {
      key: "certificate",
      header: "Certificate",
      cell: (row) =>
        row.certificate_url ? (
          <a
            href={row.certificate_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#3F576F] hover:underline"
          >
            Download
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-neutral-300">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title={courseName}
        description="Learner progress and certificates for this course."
        actions={
          <Button asChild variant="outline">
            <Link href="/business-dashboard/certificates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to certificates
            </Link>
          </Button>
        }
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
        rows={rows}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No learners found"
        emptyDescription="Learners assigned to this course will appear here."
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
