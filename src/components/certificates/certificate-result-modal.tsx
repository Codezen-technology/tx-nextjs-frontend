"use client";

import { useEffect } from "react";
import { Award, X, XCircle } from "lucide-react";

export interface VerifyResult {
  valid: boolean;
  code: string;
  certificate_url: string | null;
  course: { id: number; title: string; slug: string } | null;
  student_name: string | null;
  issue_date?: string | null;
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="font-open-sans text-xs font-semibold uppercase tracking-wide text-[#3b5374]">
        {label}
      </p>
      <div className="rounded border border-[#ebedf1] bg-white px-3 py-2 font-open-sans text-sm text-[#00204a]">
        {value}
      </div>
    </div>
  );
}

function formatDate(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function CertificateResultModal({
  result,
  onClose,
}: {
  result: VerifyResult;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Certificate verification result"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ebedf1] px-5 py-4">
          <p className="font-suse text-base font-bold text-[#00204a]">Certificate Validator</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {result.valid ? (
          <>
            {/* Valid banner */}
            <div className="flex items-center gap-3 bg-green-600 px-5 py-3">
              <Award className="h-8 w-8 shrink-0 text-white" />
              <p className="font-suse text-lg font-bold text-white">
                This certificate is <span className="text-green-200">VALID!</span>
              </p>
            </div>

            {/* Body: info + preview */}
            <div className="flex flex-col gap-5 bg-[#f5f3ee] p-5 sm:flex-row">
              {/* Left: information fields */}
              <div className="flex-1 space-y-3">
                <p className="font-suse text-base font-bold text-[#00204a]">Information</p>
                <InfoField label="Student name" value={result.student_name ?? "—"} />
                <InfoField label="Course name" value={result.course?.title ?? "—"} />
                <InfoField label="Certificate code" value={result.code} />
                <InfoField label="Issue date" value={formatDate(result.issue_date)} />
              </div>

              {/* Right: PDF preview — no toolbar, no download, overlay blocks interaction */}
              {result.certificate_url && (
                <div className="flex w-full flex-col gap-2 sm:w-[200px]">
                  <p className="font-suse text-base font-bold text-[#00204a]">Certificate</p>
                  <div className="relative h-[180px] overflow-hidden rounded border border-[#ebedf1] bg-white shadow-sm">
                    <iframe
                      src={`${result.certificate_url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                      title="Certificate preview"
                      className="h-[400%] w-[400%] origin-top-left scale-[0.25] border-none"
                      loading="lazy"
                    />
                    {/* Transparent overlay — blocks right-click and drag-to-save */}
                    <div
                      className="absolute inset-0"
                      onContextMenu={(e) => e.preventDefault()}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <XCircle className="h-10 w-10 text-red-500" />
            <h3 className="font-suse text-xl font-bold text-neutral-900">
              Invalid certificate code
            </h3>
            <p className="font-open-sans text-sm text-neutral-500">
              We couldn&apos;t find a certificate matching that code. Please double-check and try
              again.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded bg-secondary-500 px-6 py-2 font-open-sans text-sm font-semibold text-white hover:bg-secondary-600"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
