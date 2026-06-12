"use client";

import { useState } from "react";
import { BadgeCheck, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VerifyResult {
  valid: boolean;
  code: string;
  certificate_url: string | null;
  course: { id: number; title: string; slug: string } | null;
  student_name: string | null;
}

type Status = "idle" | "checking" | "done" | "error";

export function CertificateVerifyForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    if (!code) return;

    setStatus("checking");
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/certificates/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: VerifyResult;
        error?: { message?: string } | string;
      };

      if (!res.ok || !body.data) {
        const msg =
          typeof body.error === "string"
            ? body.error
            : (body.error?.message ?? "Could not verify the certificate. Please try again.");
        throw new Error(msg);
      }

      setResult(body.data);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not verify the certificate.");
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="certificate-code">Certificate code</Label>
          <Input
            id="certificate-code"
            name="code"
            placeholder="Enter certificate code"
            required
            autoComplete="off"
          />
        </div>
        <Button
          type="submit"
          disabled={status === "checking"}
          className="w-full bg-secondary-500 text-white hover:bg-secondary-600"
          size="lg"
        >
          {status === "checking" && <Loader2 className="animate-spin" />}
          Validate
        </Button>
      </form>

      {status === "error" && error && (
        <p role="alert" className="font-open-sans text-sm text-red-600">
          {error}
        </p>
      )}

      {status === "done" && result && (
        <div
          role="status"
          className={
            result.valid
              ? "rounded-lg border border-green-200 bg-green-50 p-6"
              : "rounded-lg border border-red-200 bg-red-50 p-6"
          }
        >
          {result.valid ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <BadgeCheck className="h-8 w-8 text-green-600" />
              <h3 className="font-suse text-lg font-bold text-neutral-900">Certificate is valid</h3>
              {result.student_name && (
                <p className="font-open-sans text-sm text-neutral-600">
                  Issued to <span className="font-semibold">{result.student_name}</span>
                  {result.course ? (
                    <>
                      {" "}
                      for <span className="font-semibold">{result.course.title}</span>
                    </>
                  ) : null}
                </p>
              )}
              {result.certificate_url && (
                <a
                  href={result.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 font-open-sans text-sm font-semibold text-secondary-500 underline hover:text-secondary-600"
                >
                  View certificate (PDF)
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <h3 className="font-suse text-lg font-bold text-neutral-900">
                Invalid certificate code
              </h3>
              <p className="font-open-sans text-sm text-neutral-600">
                We couldn&apos;t find a certificate matching that code. Please double-check and try
                again.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
