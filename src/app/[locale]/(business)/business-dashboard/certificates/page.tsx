"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Eye, Search } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { StatusBadge } from "@/components/business/status-badge";
import { Input } from "@/components/ui/input";
import { useBusinessCertificates, useReportCourseOptions } from "@/lib/hooks/useBusinessDashboard";
import type { BusinessCertificate } from "@/types/business-dashboard";

const PER_PAGE_OPTIONS = [10, 25, 50];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
}

export default function BusinessCertificatesPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [courseId, setCourseId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, isError } = useBusinessCertificates({
    page,
    per_page: perPage,
    search,
    status,
    course_id: courseId ? Number(courseId) : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });
  const { data: courseOptions } = useReportCourseOptions();

  const rows = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const columns: Column<BusinessCertificate>[] = [
    {
      key: "learner",
      header: "Learner",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{row.learner_name || "—"}</p>
          <p className="truncate text-xs text-neutral-300">{row.learner_email}</p>
        </div>
      ),
    },
    {
      key: "course",
      header: "Course",
      cell: (row) =>
        row.course_id ? (
          <Link
            href={`/business-dashboard/certificates/${row.course_id}`}
            className="font-medium text-[#3F576F] hover:underline"
          >
            {row.course_name}
          </Link>
        ) : (
          row.course_name || "—"
        ),
    },
    { key: "issued", header: "Issued", cell: (row) => formatDate(row.issued_date) },
    { key: "expires", header: "Expires", cell: (row) => formatDate(row.expiry_date) },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions",
      header: "",
      className: "w-24",
      cell: (row) =>
        row.certificate_url ? (
          <div className="flex items-center gap-3">
            <a
              href={row.certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Preview certificate for ${row.learner_name}`}
              className="text-neutral-300 transition-colors hover:text-[#3F576F]"
            >
              <Eye className="h-4 w-4" />
            </a>
            <a
              href={row.certificate_url}
              download
              aria-label={`Download certificate for ${row.learner_name}`}
              className="text-neutral-300 transition-colors hover:text-[#3F576F]"
            >
              <Download className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <span className="text-sm text-neutral-300">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Certificates"
        description="Every certificate issued to your learners."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={onSearch} className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-300" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search learners or courses..."
            className="pl-9"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by course"
            className="border-neutral-30 h-9 rounded-lg border bg-white px-2 text-sm text-neutral-900"
          >
            <option value="">All courses</option>
            {(courseOptions ?? []).map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.title}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-sm text-neutral-300">
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="border-neutral-30 h-9 rounded-lg border bg-white px-2 text-sm text-neutral-900"
            />
          </label>

          <label className="flex items-center gap-1.5 text-sm text-neutral-300">
            To
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="border-neutral-30 h-9 rounded-lg border bg-white px-2 text-sm text-neutral-900"
            />
          </label>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
            className="border-neutral-30 h-9 rounded-lg border bg-white px-2 text-sm text-neutral-900"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

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

      <BusinessDataTable<BusinessCertificate>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No certificates yet"
        emptyDescription="Certificates appear here once learners complete their courses."
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
