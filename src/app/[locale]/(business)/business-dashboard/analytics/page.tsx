"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useBusinessReportCertificates,
  useBusinessReportCourses,
  useBusinessReportMembers,
} from "@/lib/hooks/useBusinessDashboard";
import type { ReportCertificate, ReportCourse, ReportMember } from "@/types/business-dashboard";

const PER_PAGE = 10;

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

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
    { key: "date", header: "Completion Date", cell: (r) => formatDate(r.completion_date) },
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

export default function BusinessAnalyticsPage() {
  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Analytics & Reports"
        description="Track course, member and certificate performance."
      />

      <Tabs defaultValue="courses">
        <TabsList className="h-auto w-full justify-start gap-2 rounded-none border-b border-neutral-30 bg-transparent p-0">
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
