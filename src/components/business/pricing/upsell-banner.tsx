"use client";

import type { UpsellHint } from "@/types/business-pricing";

interface UpsellBannerProps {
  hint: UpsellHint | null;
  unit?: string;
}

export function UpsellBanner({ hint, unit = "licence" }: UpsellBannerProps) {
  if (!hint?.qty_needed) return null;

  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
      <span>🔥</span>
      <span>
        Add{" "}
        <strong>
          {hint.qty_needed} more {unit}
          {hint.qty_needed !== 1 ? "s" : ""}
        </strong>{" "}
        to get <strong>{hint.next_discount}% off</strong> your entire order.
      </span>
    </div>
  );
}
