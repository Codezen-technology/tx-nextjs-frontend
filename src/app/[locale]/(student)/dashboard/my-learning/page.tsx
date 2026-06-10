"use client";

import { useRef, useState } from "react";
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
} from "@/lib/hooks/useStudentDashboard";
import type { Certificate } from "@/types/student-dashboard";

type LearningTab = "active" | "completed" | "certificates";

export default function MyLearningPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as LearningTab) || "active";

  const [activeTab, setActiveTab] = useState<LearningTab>(initialTab);
  const [sort, setSort] = useState<SortOption>("recently_accessed");
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [certPage, setCertPage] = useState(1);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  const summaryQuery = useStudentSummary();
  const counters = summaryQuery.data?.counters ?? {
    active: 0,
    completed: 0,
    certificates: 0,
  };

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

  const certQuery = useStudentCertificates({
    page: certPage,
    per_page: 12,
    search: search || undefined,
  });

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
            className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-lms-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Active Training ({counters.active})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-lms-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Completed Training ({counters.completed})
          </TabsTrigger>
          <TabsTrigger
            value="certificates"
            className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-lms-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
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

        <TabsContent value="active" className="mt-4">
          {activeQuery.isError && <DashboardErrorBanner />}
          {activeQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

        <TabsContent value="completed" className="mt-4">
          {completedQuery.isError && <DashboardErrorBanner />}
          {completedQuery.isLoading ? (
            <div>
              {Array.from({ length: 3 }).map((_, i) => (
                <CompletedCourseRowSkeleton key={i} />
              ))}
            </div>
          ) : !completedQuery.data?.courses.length ? (
            <EmptyState title="No completed courses yet" description="" />
          ) : (
            <>
              <div>
                {completedQuery.data.courses.map((course) => (
                  <CompletedCourseRow key={course.id} course={course} />
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

        <TabsContent value="certificates" className="mt-4">
          {certQuery.isError && <DashboardErrorBanner />}
          {certQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CertificateCardSkeleton key={i} />
              ))}
            </div>
          ) : !certQuery.data?.certificates.length ? (
            <EmptyState
              title="No certificates yet"
              description="Complete a course to earn your first certificate."
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {certQuery.data.certificates.map((cert) => (
                  <CertificateCard
                    key={cert.course_id}
                    certificate={cert}
                    onShare={setSelectedCert}
                  />
                ))}
              </div>
              <Pagination
                page={certPage}
                totalPages={certQuery.data.totalPages ?? 1}
                onPageChange={handlePageChange(setCertPage)}
                className="mt-8"
              />
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
