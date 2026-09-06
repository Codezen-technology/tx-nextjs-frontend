"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, ExternalLink, Grid3x3, TrendingUp } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { KpiCard } from "@/components/business/kpi-card";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useBusinessReportCertificates,
  useBusinessReportCourses,
  useBusinessReportMembers,
  useBusinessSummary,
} from "@/lib/hooks/useBusinessDashboard";
import type { ReportCertificate, ReportCourse, ReportMember } from "@/types/business-dashboard";
import { formatBusinessDate } from "@/lib/utils/business-dates";

const PER_PAGE = 10;

function CourseReports() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useBusinessReportCourses({ page, per_page: PER_PAGE });
  const columns: Column<ReportCourse>[] = [
    {
      key: "name",
      header: "Course",
      cell: (r) => <span className="font-medium text-neutral-900">{r.name}</span>,
    },
    { key: "assigned", header: "Assigned", cell: (r) => r.assigned_count ?? 0 },
    { key: "progress", header: "In Progress", cell: (r) => r.in_progress_count ?? 0 },
    { key: "completed", header: "Completed", cell: (r) => r.completed_count ?? 0 },
    { key: "certs", header: "Certificates", cell: (r) => r.certificate_count ?? 0 },
  ];
  return (
    <BusinessDataTable<ReportCourse>
      columns={columns}
      rows={data?.items}
      rowKey={(r) => r.id}
      isLoading={isLoading}
      isError={isError}
      emptyTitle="No course data"
      page={page}
      totalPages={data?.pages ?? 1}
      onPageChange={setPage}
    />
  );
}

function MemberReports() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useBusinessReportMembers({ page, per_page: PER_PAGE });
  const columns: Column<ReportMember>[] = [
    {
      key: "name",
      header: "Member",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3F576F]/10 text-xs font-semibold text-[#3F576F]">
            {(r.name || "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-900">{r.name}</p>
            <p className="truncate text-xs text-neutral-300">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: "assigned", header: "Assigned", cell: (r) => r.assigned_count ?? 0 },
    { key: "progress", header: "In Progress", cell: (r) => r.in_progress_count ?? 0 },
    { key: "completed", header: "Completed", cell: (r) => r.completed_count ?? 0 },
    { key: "certs", header: "Certificates", cell: (r) => r.certificate_count ?? 0 },
  ];
  return (
    <BusinessDataTable<ReportMember>
      columns={columns}
      rows={data?.items}
      rowKey={(r) => r.id}
      isLoading={isLoading}
      isError={isError}
      emptyTitle="No member data"
      page={page}
      totalPages={data?.pages ?? 1}
      onPageChange={setPage}
    />
  );
}

function CertificateReports() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useBusinessReportCertificates({ page, per_page: PER_PAGE });
  const columns: Column<ReportCertificate>[] = [
    { key: "course", header: "Course", cell: (r) => r.course_name },
    { key: "learner", header: "Learner", cell: (r) => r.learner_name },
    { key: "date", header: "Completion Date", cell: (r) => formatBusinessDate(r.completion_date) },
    {
      key: "actions",
      header: "Certificate",
      cell: (r) =>
        r.certificate_url ? (
          <a
            href={r.certificate_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#3F576F] hover:underline"
          >
            View
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-neutral-300">—</span>
        ),
    },
  ];
  return (
    <BusinessDataTable<ReportCertificate>
      columns={columns}
      rows={data?.items}
      rowKey={(r) => r.id}
      isLoading={isLoading}
      isError={isError}
      emptyTitle="No certificate data"
      page={page}
      totalPages={data?.pages ?? 1}
      onPageChange={setPage}
    />
  );
}

const TAB_TRIGGER =
  "rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm font-medium text-neutral-300 data-[state=active]:border-[#3F576F] data-[state=active]:bg-transparent data-[state=active]:text-[#3F576F] data-[state=active]:shadow-none";

/**
 * The four figures the legacy Reports landing shows.
 *
 * `enrolments_completed` rather than `total_completed`: the latter counts the
 * stored status column, which is not pass-mark aware, so the two disagree
 * whenever someone finished a course below the passing mark.
 */
function ReportsSummary() {
  const { data } = useBusinessSummary();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total enrolments"
        value={data?.total_enrolments ?? 0}
        icon={BarChart3}
        tone="primary"
      />
      <KpiCard
        label="Completed"
        value={data?.enrolments_completed ?? 0}
        icon={TrendingUp}
        tone="success"
      />
      <KpiCard
        label="In progress"
        value={data?.total_in_progress ?? 0}
        icon={TrendingUp}
        tone="amber"
      />
      <KpiCard
        label="Compliance rate"
        value={`${data?.compliance_rate ?? 0}%`}
        icon={Grid3x3}
        tone="warning"
        hint="Completed as a share of enrolments"
      />
    </div>
  );
}

function ReportLinks() {
  const links = [
    {
      href: "/business-dashboard/analytics/reports",
      title: "Status reports",
      body: "Every learner and course enrolment, filtered by completion status. Exportable.",
    },
    {
      href: "/business-dashboard/analytics/matrix",
      title: "Training matrix",
      body: "The whole learner-by-course compliance grid, against your passing mark.",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="border-neutral-30 rounded-xl border bg-white p-5 shadow-xs transition-colors hover:border-[#3F576F]/40"
        >
          <h3 className="font-semibold text-neutral-900">{link.title}</h3>
          <p className="mt-1 text-sm text-neutral-300">{link.body}</p>
        </Link>
      ))}
    </div>
  );
}

export default function BusinessAnalyticsPage() {
  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Analytics & Reports"
        description="Track course, member and certificate performance."
      />

      <ReportsSummary />

      <ReportLinks />

      <Tabs defaultValue="courses">
        <TabsList className="border-neutral-30 h-auto w-full justify-start gap-2 rounded-none border-b bg-transparent p-0">
          <TabsTrigger value="courses" className={TAB_TRIGGER}>
            Course Reports
          </TabsTrigger>
          <TabsTrigger value="members" className={TAB_TRIGGER}>
            Team Members
          </TabsTrigger>
          <TabsTrigger value="certificates" className={TAB_TRIGGER}>
            Certificate Report
          </TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="mt-6">
          <CourseReports />
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <MemberReports />
        </TabsContent>
        <TabsContent value="certificates" className="mt-6">
          <CertificateReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
