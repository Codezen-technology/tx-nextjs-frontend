"use client";

import { useState } from "react";
import { Download, MoreVertical, RefreshCw, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Certificate } from "@/types/student-dashboard";

interface CertificateCardProps {
  certificate: Certificate;
  onShare: (cert: Certificate) => void;
  certificateOrderLink?: string;
  transcriptOrderLink?: string;
}

const actionBtn =
  "flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-lg px-5 text-[18px] font-bold transition";

export function CertificateCard({
  certificate,
  onShare,
  certificateOrderLink,
  transcriptOrderLink,
}: CertificateCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const certAvailable = certificate.is_certificate_generated && !!certificate.certificate_url;
  const transcriptAvailable = !!certificate.is_transcript_unlocked && !!certificate.transcript_url;

  return (
    <div className="flex items-center justify-between border-b border-[#eaecee] py-6">
      {/* Course name */}
      <p className="w-[260px] shrink-0 text-[18px] font-bold leading-[1.3] text-[#2e4450]">
        {certificate.title}
      </p>

      {/* Action buttons */}
      <div className="ml-8 flex flex-1 flex-wrap items-center gap-3">
        {certAvailable ? (
          <a
            href={certificate.certificate_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${actionBtn} bg-[#3f4d97] text-[#f6f6fa] hover:bg-[#2e3a7a]`}
          >
            <Download className="h-5 w-5 shrink-0" />
            Download Certificate
          </a>
        ) : certificateOrderLink ? (
          <a
            href={`${certificateOrderLink}?course_id=${certificate.course_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${actionBtn} bg-[#3f4d97] text-[#f6f6fa] hover:bg-[#2e3a7a]`}
          >
            Order Certificate
          </a>
        ) : (
          <span className={`${actionBtn} cursor-not-allowed bg-[#3f4d97]/40 text-[#f6f6fa]`}>
            Order Certificate
          </span>
        )}

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

      {/* 3-dot menu */}
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
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-2xl bg-white py-2 shadow-[0_4px_20px_rgba(0,0,0,0.1)] ring-1 ring-black/5">
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
              <a
                href={certificate.course_permalink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2 text-[18px] text-[#2e4450] hover:bg-[#f6f6fa]"
              >
                <RefreshCw className="h-4 w-4" />
                Restart Course
              </a>
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
