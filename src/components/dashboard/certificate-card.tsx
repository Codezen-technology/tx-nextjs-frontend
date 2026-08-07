"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Loader2, MoreVertical, RefreshCw, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Certificate,
  GenerateCertificateResponse,
  UnlockCertificateResponse,
} from "@/types/student-dashboard";

interface CertificateCardProps {
  certificate: Certificate;
  onShare: (cert: Certificate) => void;
  certificateOrderLink?: string;
  transcriptOrderLink?: string;
  creditsAvailable?: number;
  hasActiveSubscription?: boolean;
  onClaim?: (courseId: number) => Promise<UnlockCertificateResponse>;
  onGenerate?: (courseId: number) => Promise<GenerateCertificateResponse>;
  isClaiming?: boolean;
  isGenerating?: boolean;
  claimingCourseId?: number | null;
  generatingCourseId?: number | null;
}

const actionBtn =
  "flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-lg px-5 text-[18px] font-bold transition";

export function CertificateCard({
  certificate,
  onShare,
  certificateOrderLink = "/dashboard/certificate",
  transcriptOrderLink,
  creditsAvailable = 0,
  hasActiveSubscription = false,
  onClaim,
  onGenerate,
  isClaiming = false,
  isGenerating = false,
  claimingCourseId = null,
  generatingCourseId = null,
}: CertificateCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const certAvailable = certificate.is_certificate_generated && !!certificate.certificate_url;
  const isUnlocked = certificate.is_certificate_unlocked === "1";
  const canClaim =
    !certAvailable &&
    !isUnlocked &&
    (creditsAvailable > 0 || hasActiveSubscription) &&
    Boolean(onClaim);
  const rowIsClaiming = isClaiming && claimingCourseId === certificate.course_id;
  const rowIsGenerating = isGenerating && generatingCourseId === certificate.course_id;
  const transcriptAvailable = !!certificate.is_transcript_unlocked && !!certificate.transcript_url;
  const orderHref = `${certificateOrderLink}?course_id=${certificate.course_id}`;

  const handleClaim = async () => {
    if (!onClaim) return;
    await onClaim(certificate.course_id);
  };

  const handleGenerate = async () => {
    if (!onGenerate) return;
    const result = await onGenerate(certificate.course_id);
    if (result?.certificate_url) {
      window.open(result.certificate_url, "_blank", "noopener");
    }
  };

  const renderCertAction = () => {
    if (certAvailable) {
      return (
        <a
          href={certificate.certificate_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${actionBtn} bg-[#3f4d97] text-[#f6f6fa] hover:bg-[#2e3a7a]`}
        >
          <Download className="h-5 w-5 shrink-0" />
          Download Certificate
        </a>
      );
    }

    if (isUnlocked && onGenerate) {
      return (
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={rowIsGenerating}
          className={`${actionBtn} bg-[#3f4d97] text-[#f6f6fa] hover:bg-[#2e3a7a] disabled:opacity-60`}
        >
          {rowIsGenerating ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : null}
          Generate Certificate
        </button>
      );
    }

    if (canClaim) {
      return (
        <button
          type="button"
          onClick={() => void handleClaim()}
          disabled={rowIsClaiming}
          className={`${actionBtn} bg-[#3f4d97] text-[#f6f6fa] hover:bg-[#2e3a7a] disabled:opacity-60`}
        >
          {rowIsClaiming ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : null}
          Claim Certificate
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => router.push(orderHref)}
        className={`${actionBtn} bg-[#3f4d97] text-[#f6f6fa] hover:bg-[#2e3a7a]`}
      >
        Order Certificate
      </button>
    );
  };

  return (
    <div className="flex items-center justify-between border-b border-[#eaecee] py-6">
      <p className="w-[260px] shrink-0 text-[18px] leading-[1.3] font-bold text-[#2e4450]">
        {certificate.title}
      </p>

      <div className="ml-8 flex flex-1 flex-wrap items-center gap-3">
        {renderCertAction()}

        {transcriptAvailable ? (
          <a
            href={certificate.transcript_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${actionBtn} bg-[#3f4d97] text-[#f6f6fa] hover:bg-[#2e3a7a]`}
          >
            <Download className="h-5 w-5 shrink-0" />
            Download Transcript
          </a>
        ) : transcriptOrderLink ? (
          <a
            href={transcriptOrderLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`${actionBtn} bg-[#3f4d97] text-[#f6f6fa] hover:bg-[#2e3a7a]`}
          >
            Order Transcript
          </a>
        ) : (
          <span className={`${actionBtn} cursor-not-allowed bg-[#3f4d97]/40 text-[#f6f6fa]`}>
            Order Transcript
          </span>
        )}
      </div>

      <div className="relative ml-2 shrink-0">
        <button
          type="button"
          aria-label="More options"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded text-[#2e4450] hover:bg-[#f0f1f5]"
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute top-full right-0 z-20 mt-1 min-w-[160px] rounded-2xl bg-white py-2 shadow-[0_4px_20px_rgba(0,0,0,0.1)] ring-1 ring-black/5">
              {certAvailable && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onShare(certificate);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-[18px] text-[#2e4450] hover:bg-[#f6f6fa]"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  <hr className="my-1 border-[#eaecee]" />
                </>
              )}
              <Link
                href={certificate.course_permalink}
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2 text-[18px] text-[#2e4450] hover:bg-[#f6f6fa]"
              >
                <RefreshCw className="h-4 w-4" />
                Restart Course
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CertificateCardSkeleton() {
  return (
    <div className="flex items-center justify-between border-b border-[#eaecee] py-6">
      <Skeleton className="h-6 w-[260px] shrink-0 bg-[#e2e8ee]" />
      <div className="ml-8 flex flex-1 items-center gap-3">
        <Skeleton className="h-14 w-[220px] rounded-lg bg-[#e2e8ee]" />
        <Skeleton className="h-14 w-[220px] rounded-lg bg-[#e2e8ee]" />
      </div>
      <Skeleton className="ml-2 h-8 w-8 shrink-0 rounded bg-[#e2e8ee]" />
    </div>
  );
}
