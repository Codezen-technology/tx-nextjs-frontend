"use client";

import { Loader2 } from "lucide-react";

interface CheckoutProcessingOverlayProps {
  show: boolean;
  message?: string;
}

/** Full-viewport white overlay shown while checkout payment is processing. */
export function CheckoutProcessingOverlay({
  show,
  message = "Processing your order…",
}: CheckoutProcessingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/95"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#9e6f21]" />
        <p className="font-suse text-lg font-medium text-[#00204a]">{message}</p>
      </div>
    </div>
  );
}
