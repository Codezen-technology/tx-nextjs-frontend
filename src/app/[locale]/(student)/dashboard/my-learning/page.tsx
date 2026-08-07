"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  LearningCourseCard,
  LearningCourseCardSkeleton,
} from "@/components/dashboard/learning-course-card";
import {
  CompletedCourseRow,
  CompletedCourseRowSkeleton,
} from "@/components/dashboard/completed-course-row";
import { CertificateCard, CertificateCardSkeleton } from "@/components/dashboard/certificate-card";
import { CertificateShareDialog } from "@/components/dashboard/certificate-share-dialog";
import { CourseFilterBar, type SortOption } from "@/components/dashboard/course-filter-bar";
import { PromoCardsSection } from "@/components/dashboard/promo-cards-section";
import { DashboardErrorBanner } from "@/components/dashboard/dashboard-error-banner";
import {
  useStudentCertificates,
  useStudentCourses,
  useStudentSummary,
  useUnlockCertificate,
  useGenerateCertificate,
  useMiscellaneousSettings,
} from "@/lib/hooks/useStudentDashboard";
import type { Certificate } from "@/types/student-dashboard";

type LearningTab = "active" | "completed" | "certificates";
type CertFilter = "all" | "certificate" | "transcript";

const CERT_FILTER_OPTIONS: { value: CertFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "certificate", label: "Has Certificate" },
  { value: "transcript", label: "Has Transcript" },
];

function hasCert(c: Certificate) {
  return c.is_certificate_generated && !!c.certificate_url;
}
function hasTranscript(c: Certificate) {
  return !!c.is_transcript_unlocked && !!c.transcript_url;
}

export default function MyLearningPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as LearningTab) || "active";

  const [activeTab, setActiveTab] = useState<LearningTab>(initialTab);
  const [sort, setSort] = useState<SortOption>("recently_accessed");
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [certPage, setCertPage] = useState(1);
  const [certFilter, setCertFilter] = useState<CertFilter>("all");
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  const summaryQuery = useStudentSummary();
  const miscQuery = useMiscellaneousSettings();
  const unlockMutation = useUnlockCertificate();
  const generateMutation = useGenerateCertificate();
  const counters = summaryQuery.data?.counters ?? {
    active: 0,
    completed: 0,
    certificates: 0,
  };
  const creditsAvailable = summaryQuery.data?.certificate_credits_available ?? 0;
  const hasActiveSubscription = summaryQuery.data?.has_active_subscription ?? false;
  const certificateOrderLink = miscQuery.data?.certificate_order_link ?? "/dashboard/certificate";
  const transcriptOrderLink = miscQuery.data?.transcript_order_link ?? "";

  const handleClaim = (courseId: number) => unlockMutation.mutateAsync(courseId);
  const handleGenerate = (courseId: number) => generateMutation.mutateAsync(courseId);

  const activeQuery = useStudentCourses({
    access: "active",
    page: activePage,
    per_page: 12,
    search: search || undefined,
    orderby: sort,
  });

  const completedQuery = useStudentCourses({
    access: "completed",
    page: completedPage,
    per_page: 12,
    search: search || undefined,
    orderby: sort,
  });

  // Paginated for "all", fetch all for sub-filters (matching plugin behavior)
  const certQuery = useStudentCertificates({
    page: certFilter !== "all" ? 1 : certPage,
    per_page: certFilter !== "all" ? 999 : 12,
    search: search || undefined,
  });

  // Separate count query for filter badge numbers
  const certCountQuery = useStudentCertificates({ page: 1, per_page: 999 });
  const certCounts = useMemo(() => {
    const all = certCountQuery.data?.certificates ?? [];
    if (!certCountQuery.data) return null;
    return {
      all: certCountQuery.data.total ?? all.length,
      certificate: all.filter(hasCert).length,
      transcript: all.filter(hasTranscript).length,
    };
  }, [certCountQuery.data]);

  const filteredCerts = useMemo(() => {
    const certs = certQuery.data?.certificates ?? [];
    if (certFilter === "certificate") return certs.filter(hasCert);
    if (certFilter === "transcript") return certs.filter(hasTranscript);
    return certs;
  }, [certQuery.data?.certificates, certFilter]);

  const scrollToGrid = () => {
    gridRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePageChange = (setter: (p: number) => void) => (p: number) => {
    setter(p);
    scrollToGrid();
  };

  const handleReset = () => {
    setSort("recently_accessed");
    setSearch("");
    setActivePage(1);
    setCompletedPage(1);
    setCertPage(1);
    setCertFilter("all");
  };

  const handleCertFilterChange = (f: CertFilter) => {
    setCertFilter(f);
    setCertPage(1);
  };

  return (
    <div className="min-w-0">
      <h1 className="mb-4 text-2xl font-bold text-[#2e4450]">My Learning</h1>
      <hr className="border-[#eaecee]" />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as LearningTab)}
        className="mt-2"
      >
        <TabsList className="h-auto w-full justify-start gap-0 rounded-none bg-transparent p-0">
          <TabsTrigger
            value="active"
            className="data-[state=active]:border-lms-primary rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Active Training ({counters.active})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:border-lms-primary rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Completed Training ({counters.completed})
          </TabsTrigger>
          <TabsTrigger
            value="certificates"
            className="data-[state=active]:border-lms-primary rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Certificates ({counters.certificates})
          </TabsTrigger>
        </TabsList>

        <hr className="border-[#eaecee]" />

        {activeTab === "active" && (
          <CourseFilterBar
            search={search}
            sort={sort}
            onSearchChange={(v) => {
              setSearch(v);
              setActivePage(1);
            }}
            onSortChange={(v) => {
              setSort(v);
              setActivePage(1);
            }}
            onReset={handleReset}
          />
        )}

        <div ref={gridRef} />

        {/* ── Active Training ── */}
        <TabsContent value="active" className="mt-4">
          {activeQuery.isError && <DashboardErrorBanner />}
          {activeQuery.isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,280px))] gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <LearningCourseCardSkeleton key={i} />
              ))}
            </div>
          ) : !activeQuery.data?.courses.length ? (
            <EmptyState
              title="No active courses"
              description="Start a course to see it here."
              action={
                <Button asChild>
                  <Link href="/dashboard/all-courses">Browse courses</Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,280px))] gap-6">
                {activeQuery.data.courses.map((course) => (
                  <LearningCourseCard key={course.id} course={course} />
                ))}
              </div>
              <Pagination
                page={activePage}
                totalPages={activeQuery.data.totalPages ?? 1}
                onPageChange={handlePageChange(setActivePage)}
                className="mt-8"
              />
            </>
          )}
        </TabsContent>

        {/* ── Completed Training ── */}
        <TabsContent value="completed" className="mt-4">
          {completedQuery.isError && <DashboardErrorBanner />}

          {hasActiveSubscription ? (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-[#2e4450]">
              Your active subscription includes certificate claims for completed courses.
            </div>
          ) : creditsAvailable > 0 ? (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-[#2e4450]">
              You have {creditsAvailable} certificate credit
              {creditsAvailable !== 1 ? "s" : ""} available. Claim one on a completed course below.
            </div>
          ) : null}

          {completedQuery.isLoading ? (
            <>
              {/* Column headers */}
              <div className="mt-2 flex w-full min-w-0 items-center gap-4">
                <span className="max-w-[350px] min-w-0 flex-1 text-2xl font-bold text-[#2e4450]">
                  Course
                </span>
                <span className="w-[280px] shrink-0 text-2xl font-bold text-[#2e4450]">
                  Progress
                </span>
                <span className="flex-1 pr-10 text-right text-2xl font-bold text-[#2e4450]">
                  Action
                </span>
              </div>
              <hr className="mt-1 border-[#eaecee]" />
              {Array.from({ length: 3 }).map((_, i) => (
                <CompletedCourseRowSkeleton key={i} />
              ))}
            </>
          ) : !completedQuery.data?.courses.length ? (
            <EmptyState title="No completed courses yet" description="" />
          ) : (
            <>
              {/* Column headers */}
              <div className="mt-2 flex w-full min-w-0 items-center gap-4">
                <span className="max-w-[350px] min-w-0 flex-1 text-2xl font-bold text-[#2e4450]">
                  Course
                </span>
                <span className="w-[280px] shrink-0 text-2xl font-bold text-[#2e4450]">
                  Progress
                </span>
                <span className="flex-1 pr-10 text-right text-2xl font-bold text-[#2e4450]">
                  Action
                </span>
              </div>
              <hr className="mt-1 border-[#eaecee]" />
              <div>
                {completedQuery.data.courses.map((course) => (
                  <CompletedCourseRow
                    key={course.id}
                    course={course}
                    certificateOrderLink={certificateOrderLink}
                    creditsAvailable={creditsAvailable}
                    hasActiveSubscription={hasActiveSubscription}
                    onClaim={handleClaim}
                    onGenerate={handleGenerate}
                    isClaiming={unlockMutation.isPending}
                    isGenerating={generateMutation.isPending}
                    claimingCourseId={unlockMutation.variables}
                    generatingCourseId={generateMutation.variables}
                  />
                ))}
              </div>
              <Pagination
                page={completedPage}
                totalPages={completedQuery.data.totalPages ?? 1}
                onPageChange={handlePageChange(setCompletedPage)}
                className="mt-8"
              />
            </>
          )}
        </TabsContent>

        {/* ── Certificates ── */}
        <TabsContent value="certificates" className="mt-4">
          {certQuery.isError && <DashboardErrorBanner />}

          {/* Filter pills */}
          <div className="mb-4 flex flex-wrap gap-2">
            {CERT_FILTER_OPTIONS.map(({ value, label }) => {
              const active = certFilter === value;
              const count = certCounts ? certCounts[value] : null;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleCertFilterChange(value)}
                  className={[
                    "flex items-center gap-1.5 rounded-[20px] px-4 py-2 text-[13px] leading-none font-semibold transition",
                    active
                      ? "bg-[#3f4d97] text-white hover:bg-[#0f217d]"
                      : "border border-[#d0d5df] bg-[#f6f6fa] text-[#2e4450] hover:bg-[#eef0f9]",
                  ].join(" ")}
                >
                  {label}
                  {count !== null && (
                    <span
                      className={[
                        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] px-1 text-[11px] leading-none font-bold",
                        active ? "bg-white/25 text-white" : "bg-[#e2e8ee] text-[#2e4450]",
                      ].join(" ")}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {certQuery.isLoading ? (
            <div>
              <div className="flex items-center justify-between pb-4 text-[24px] font-bold text-[#2e4450]">
                <span className="w-[260px]">Course</span>
                <span className="mr-8">Action</span>
              </div>
              <hr className="border-[#eaecee]" />
              {Array.from({ length: 5 }).map((_, i) => (
                <CertificateCardSkeleton key={i} />
              ))}
            </div>
          ) : !filteredCerts.length ? (
            <EmptyState
              title={
                certFilter === "certificate"
                  ? "No certificates available"
                  : certFilter === "transcript"
                    ? "No transcripts available"
                    : "No certificates yet"
              }
              description={
                certFilter === "all" ? "Complete a course to earn your first certificate." : ""
              }
            />
          ) : (
            <>
              <div className="flex items-center justify-between pb-4 text-[24px] font-bold text-[#2e4450]">
                <span className="w-[260px]">Course</span>
                <span className="mr-8">Action</span>
              </div>
              <hr className="border-[#eaecee]" />
              {filteredCerts.map((cert) => (
                <CertificateCard
                  key={cert.course_id}
                  certificate={cert}
                  onShare={setSelectedCert}
                  certificateOrderLink={certificateOrderLink}
                  transcriptOrderLink={transcriptOrderLink}
                  creditsAvailable={creditsAvailable}
                  hasActiveSubscription={hasActiveSubscription}
                  onClaim={handleClaim}
                  onGenerate={handleGenerate}
                  isClaiming={unlockMutation.isPending}
                  isGenerating={generateMutation.isPending}
                  claimingCourseId={unlockMutation.variables}
                  generatingCourseId={generateMutation.variables}
                />
              ))}
              {certFilter === "all" && (
                <Pagination
                  page={certPage}
                  totalPages={certQuery.data?.totalPages ?? 1}
                  onPageChange={handlePageChange(setCertPage)}
                  className="mt-8"
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <CertificateShareDialog
        certificate={selectedCert}
        open={Boolean(selectedCert)}
        onClose={() => setSelectedCert(null)}
      />

      <PromoCardsSection />
    </div>
  );
}
