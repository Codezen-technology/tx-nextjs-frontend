"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CertificateResultModal } from "./certificate-result-modal";
import type { VerifyResult } from "./certificate-result-modal";

type Status = "idle" | "checking" | "done" | "error";

export { type VerifyResult };

export async function verifyCertificate(code: string): Promise<VerifyResult> {
  const res = await fetch("/api/certificates/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code: code.trim() }),
  });

  const body = (await res.json().catch(() => ({}))) as
    | { success: true; data: VerifyResult }
    | VerifyResult
    | { success: false; error?: { message?: string } | string }
    | { error?: { message?: string } | string };

  if (!res.ok) {
    const errObj = (body as { error?: { message?: string } | string }).error;
    const msg =
      typeof errObj === "string"
        ? errObj
        : (errObj?.message ?? "Could not verify the certificate. Please try again.");
    throw new Error(msg);
  }

  // Normalise both { success, data } envelope and flat response shapes
  const result: VerifyResult =
    "data" in body && body.data != null
      ? (body as { data: VerifyResult }).data
      : (body as VerifyResult);

  if (result.valid == null) {
    throw new Error("Could not verify the certificate. Please try again.");
  }

  return result;
}

export function CertificateVerifyForm({ initialCode }: { initialCode?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const didAutoVerify = useRef(false);

  async function verify(code: string) {
    if (!code.trim()) return;
    setStatus("checking");
    setResult(null);
    setError(null);
    try {
      const r = await verifyCertificate(code);
      setResult(r);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not verify the certificate.");
    }
  }

  // Auto-verify when arriving via footer link or ?code= URL param
  useEffect(() => {
    if (initialCode && !didAutoVerify.current) {
      didAutoVerify.current = true;
      void verify(initialCode);
    }
     
  }, [initialCode]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    await verify(code);
  }

  return (
    <>
      <div className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="certificate-code">Certificate code</Label>
            <Input
              id="certificate-code"
              name="code"
              defaultValue={initialCode ?? ""}
              placeholder="Enter certificate code"
              required
              autoComplete="off"
            />
          </div>
          <Button
            type="submit"
            disabled={status === "checking"}
            className="bg-secondary-500 hover:bg-secondary-600 w-full text-white"
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
      </div>

      {status === "done" && result && (
        <CertificateResultModal result={result} onClose={() => setStatus("idle")} />
      )}
    </>
  );
}
