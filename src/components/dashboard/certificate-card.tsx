"use client";

import Link from "next/link";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SafeImage } from "@/components/ui/safe-image";
import type { Certificate } from "@/types/student-dashboard";

const FALLBACK = "/dashboard/no-image.jpg";

interface CertificateCardProps {
  certificate: Certificate;
  onShare: (cert: Certificate) => void;
}

export function CertificateCard({ certificate, onShare }: CertificateCardProps) {
  const unlocked = certificate.is_certificate_unlocked === "1";
  const pdfUrl = certificate.certificate_url || certificate.lms_certificate_url;

  return (
    <article className="overflow-hidden rounded-2xl bg-[#f6f6fa]">
      <div className="relative h-40">
        <SafeImage
          src={
            typeof certificate.featured_image === "string" ? certificate.featured_image : FALLBACK
          }
          alt={certificate.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 font-bold text-[#2e4450]">{certificate.title}</h3>
        <p className="text-sm text-[#586973]">
          {unlocked ? "Certificate unlocked" : "Complete course to unlock"}
        </p>
        <div className="flex flex-wrap gap-2">
          {pdfUrl && typeof pdfUrl === "string" && (
            <>
              <Button asChild size="sm" variant="outline">
                <Link href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  View
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={pdfUrl} download>
                  <Download className="mr-1 h-4 w-4" />
                  Download PDF
                </a>
              </Button>
            </>
          )}
          {unlocked && (
            <Button size="sm" variant="secondary" onClick={() => onShare(certificate)}>
              <Share2 className="mr-1 h-4 w-4" />
              Share
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function CertificateCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#f6f6fa]">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}
