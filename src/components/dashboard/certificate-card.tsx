"use client";

import { Download, MoreVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Certificate } from "@/types/student-dashboard";

interface CertificateCardProps {
  certificate: Certificate;
  onShare: (cert: Certificate) => void;
}

export function CertificateCard({ certificate, onShare }: CertificateCardProps) {
  const pdfUrl = certificate.certificate_url || certificate.lms_certificate_url;
  const canDownload = pdfUrl && typeof pdfUrl === "string";

  return (
    <div className="flex items-center justify-between border-b border-[#eaecee] py-6">
      <p className="w-[260px] shrink-0 text-[18px] font-bold leading-[1.3] text-[#2e4450]">
        {certificate.title}
      </p>

      <div className="flex items-center gap-4">
        {canDownload ? (
          <a
            href={pdfUrl as string}
            download
            className="flex h-14 w-[220px] items-center justify-center gap-2 rounded-lg bg-[#3f4d97] text-[18px] font-bold text-[#f6f6fa] transition hover:bg-[#3f4d97]/90"
          >
            <Download className="h-6 w-6 shrink-0" />
            Download Certificate
          </a>
        ) : (
          <span className="flex h-14 w-[220px] cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#3f4d97]/40 text-[18px] font-bold text-[#f6f6fa]">
            <Download className="h-6 w-6 shrink-0" />
            Download Certificate
          </span>
        )}

        <button
          type="button"
          onClick={() => onShare(certificate)}
          className="flex h-14 items-center justify-center rounded-lg bg-[#108a97] px-6 text-[18px] font-bold text-[#f6f6fa] transition hover:bg-[#108a97]/90"
        >
          Order Hardcopy Certificate
        </button>
      </div>

      <button
        type="button"
        aria-label="More options"
        className="flex h-8 w-8 shrink-0 items-center justify-center text-[#2e4450]"
      >
        <MoreVertical className="h-6 w-6" />
      </button>
    </div>
  );
}

export function CertificateCardSkeleton() {
  return (
    <div className="flex items-center justify-between border-b border-[#eaecee] py-6">
      <Skeleton className="h-6 w-[260px] shrink-0 bg-[#e2e8ee]" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-[220px] rounded-lg bg-[#e2e8ee]" />
        <Skeleton className="h-14 w-[240px] rounded-lg bg-[#e2e8ee]" />
      </div>
      <Skeleton className="h-6 w-6 shrink-0 rounded bg-[#e2e8ee]" />
    </div>
  );
}
