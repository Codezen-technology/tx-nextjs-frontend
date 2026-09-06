"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Building2, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import { useDeleteBusinessLogo, useUploadBusinessLogo } from "@/lib/hooks/useBusinessDashboard";

const MAX_BYTES = 2 * 1024 * 1024;

interface BusinessLogoProps {
  /** The `b2b_businesses` row id — `Business.id`, not the owner user id. */
  businessId: number;
  logoUrl: string | null;
  companyName: string;
}

export function BusinessLogo({ businessId, logoUrl, companyName }: BusinessLogoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const upload = useUploadBusinessLogo();
  const remove = useDeleteBusinessLogo();
  const busy = upload.isPending || remove.isPending;

  const onFile = async (file: File | undefined) => {
    setError("");
    if (!file) return;

    // Checked here as well as server-side so an oversized file fails instantly
    // rather than after the upload completes.
    if (file.size > MAX_BYTES) {
      setError("That image is larger than 2 MB.");
      return;
    }

    try {
      await upload.mutateAsync({ businessId, file });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not upload that image. Please try again.",
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-start gap-4">
      <div className="border-neutral-30 bg-neutral-10 relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
        {logoUrl ? (
          <Image src={logoUrl} alt={`${companyName} logo`} fill className="object-contain p-1" />
        ) : (
          <Building2 className="h-8 w-8 text-neutral-200" />
        )}
        {busy ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-5 w-5 animate-spin text-[#3F576F]" />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {logoUrl ? "Replace logo" : "Upload logo"}
          </Button>

          {logoUrl ? (
            confirmingDelete ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={async () => {
                    setError("");
                    try {
                      await remove.mutateAsync(businessId);
                    } catch {
                      setError("Could not remove the logo.");
                    } finally {
                      setConfirmingDelete(false);
                    }
                  }}
                >
                  Confirm remove
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )
          ) : null}
        </div>

        <p className="text-xs text-neutral-300">PNG, JPEG or WebP. Up to 2 MB.</p>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </div>
  );
}
