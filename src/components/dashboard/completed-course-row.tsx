"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, MoreVertical } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getCourseContinueUrl } from "@/lib/utils/student-dashboard";
import type { GenerateCertificateResponse } from "@/types/student-dashboard";
import type { StudentCourse, UnlockCertificateResponse } from "@/types/student-dashboard";

interface CompletedCourseRowProps {
  course: StudentCourse;
  certificateOrderLink: string;
  creditsAvailable: number;
  hasActiveSubscription?: boolean;
  onClaim: (courseId: number) => Promise<UnlockCertificateResponse>;
  onGenerate: (courseId: number) => Promise<GenerateCertificateResponse>;
  isClaiming: boolean;
  isGenerating: boolean;
  claimingCourseId?: number | null;
  generatingCourseId?: number | null;
}

const actionBtn =
  "flex h-14 min-w-[140px] max-w-[220px] flex-1 items-center justify-center gap-2 rounded-lg text-[18px] font-bold transition";

export function CompletedCourseRow({
  course,
  certificateOrderLink,
  creditsAvailable,
  hasActiveSubscription = false,
  onClaim,
  onGenerate,
  isClaiming,
  isGenerating,
  claimingCourseId = null,
  generatingCourseId = null,
}: CompletedCourseRowProps) {
  const progress = course.user_progress ?? 0;
  const continueUrl = getCourseContinueUrl(course);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isUnlocked = course.is_certificate_unlocked === "1";
  const hasPdf = course.is_certificate_generated && Boolean(course.certificate_url);
  const canClaim = !hasPdf && !isUnlocked && (creditsAvailable > 0 || hasActiveSubscription);
  const rowIsClaiming = isClaiming && claimingCourseId === course.id;
  const rowIsGenerating = isGenerating && generatingCourseId === course.id;

  const orderHref = `${certificateOrderLink}?course_id=${course.id}`;

  const handleClaim = async () => {
    setActionError(null);
    try {
      await onClaim(course.id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Could not claim certificate.");
    }
  };

  const handleGenerate = async () => {
    setActionError(null);
    try {
      const result = await onGenerate(course.id);
      if (result?.certificate_url) {
        window.open(result.certificate_url, "_blank", "noopener");
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Could not generate certificate.");
    }
  };

  const renderCertificateAction = () => {
    if (hasPdf && course.certificate_url) {
      return (
        <a
          href={course.certificate_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${actionBtn} bg-[#3f4d97] text-[#f6f6fa] hover:bg-[#323d7a]`}
        >
          Download Certificate
          <ArrowRight className="h-[18px] w-[18px] shrink-0" />
        </a>
      );
    }

    if (isUnlocked) {
      return (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={rowIsGenerating}
          className={`${actionBtn} bg-[#3f4d97] text-[#f6f6fa] hover:bg-[#323d7a] disabled:opacity-60`}
        >
          Generate Certificate
          {rowIsGenerating ? (
            <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin" />
          ) : (
            <ArrowRight className="h-[18px] w-[18px] shrink-0" />
          )}
        </button>
      );
    }

    if (canClaim) {
      return (
        <button
          type="button"
          onClick={handleClaim}
          disabled={rowIsClaiming}
          className={`${actionBtn} bg-[#3f4d97] text-[#f6f6fa] hover:bg-[#323d7a] disabled:opacity-60`}
        >
          Claim Certificate
          {rowIsClaiming ? (
            <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin" />
          ) : (
            <ArrowRight className="h-[18px] w-[18px] shrink-0" />
          )}
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => router.push(orderHref)}
        className={`${actionBtn} bg-[#3f4d97] text-[#f6f6fa] hover:bg-[#323d7a]`}
      >
        Order Certificate
        <ArrowRight className="h-[18px] w-[18px] shrink-0" />
      </button>
    );
  };

  return (
    <>
      {actionError && (
        <p className="mb-2 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      )}
      <div className="flex w-full min-w-0 items-center gap-4 py-6">
        <h3 className="line-clamp-2 max-w-[350px] min-w-0 flex-1 text-[18px] leading-[1.3] font-bold text-[#2e4450]">
          {course.name}
        </h3>

        <div className="flex w-[280px] shrink-0 flex-col gap-2">
          <span className="text-[18px] font-medium whitespace-nowrap text-[#2e323e]">
            {progress}% Completed
          </span>
          <Progress
            value={progress}
            className="h-2 max-w-[248px] bg-[#eaecee] [&>div]:bg-[#3f9751]"
          />
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <Link
            href={continueUrl}
            className="flex h-14 max-w-[220px] min-w-[140px] flex-1 items-center justify-center rounded-lg bg-[#eaecee] text-[18px] font-bold text-[#2e4450] transition hover:bg-[#d8dadc]"
          >
            Reset Course
          </Link>
          {renderCertificateAction()}
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="More options"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-6 w-6 items-center justify-center text-[#2e4450]"
          >
            <MoreVertical className="h-6 w-6" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-full right-0 z-20 mt-1 min-w-[160px] rounded-lg bg-white py-1 shadow-md ring-1 ring-black/5">
                {!hasPdf && !isUnlocked && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (canClaim) void handleClaim();
                      else router.push(orderHref);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-[#2e4450] hover:bg-[#f6f6fa]"
                  >
                    {canClaim ? "Claim Certificate" : "Order Certificate"}
                  </button>
                )}
                {isUnlocked && !hasPdf && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleGenerate();
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-[#2e4450] hover:bg-[#f6f6fa]"
                  >
                    Generate Certificate
                  </button>
                )}
                <Link
                  href={continueUrl}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-[#2e4450] hover:bg-[#f6f6fa]"
                >
                  Reset Course
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export function CompletedCourseRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-6">
      <Skeleton className="h-6 w-[280px]" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="ml-auto h-14 w-[180px]" />
    </div>
  );
}
