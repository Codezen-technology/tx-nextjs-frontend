"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { CertificateResultModal } from "@/components/certificates/certificate-result-modal";
import { verifyCertificate } from "@/components/certificates/certificate-verify-form";
import type { VerifyResult } from "@/components/certificates/certificate-result-modal";

export function CertificateForm() {
  const [certCode, setCertCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    const code = certCode.trim();
    if (!code) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const r = await verifyCertificate(code);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the certificate.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleValidate} className="space-y-2">
        <div className="flex gap-4">
          <input
            type="text"
            value={certCode}
            onChange={(e) => setCertCode(e.target.value)}
            placeholder="Enter Certificate Code"
            className="border-neutral-40 font-open-sans focus:ring-secondary-500 h-10 min-w-0 flex-1 rounded-lg border bg-white px-3.5 text-[14px] leading-normal text-neutral-200 shadow-xs placeholder:text-neutral-200 focus:ring-2 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={loading}
            className="border-secondary-500 bg-secondary-500 font-open-sans hover:bg-secondary-600 flex h-10 shrink-0 items-center gap-1.5 rounded border px-3 text-[16px] leading-normal text-white transition-colors disabled:opacity-70"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Validate
          </button>
        </div>
        {error && <p className="font-open-sans text-xs text-red-400">{error}</p>}
      </form>

      {result && <CertificateResultModal result={result} onClose={() => setResult(null)} />}
    </>
  );
}
