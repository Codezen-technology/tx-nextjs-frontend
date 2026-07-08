"use client";

import type { PricingTab } from "@/types/business-pricing";
import { cn } from "@/lib/utils/cn";

interface PricingHeaderProps {
  tab: PricingTab;
  onTabChange: (tab: PricingTab) => void;
  quoteSuccess: boolean;
  onDismissQuote: () => void;
  maxDiscount: number;
  onOpenBulkModal: () => void;
}

export function PricingHeader({
  tab,
  onTabChange,
  quoteSuccess,
  onDismissQuote,
  maxDiscount,
  onOpenBulkModal,
}: PricingHeaderProps) {
  return (
    <>
      <div className="mb-8 text-center">
        <p className="mb-2 text-sm font-semibold tracking-widest text-[#3F576F] uppercase">
          Pricing
        </p>
        <h1 className="mb-2 text-3xl font-bold text-neutral-900">Simple, transparent pricing</h1>
        <p className="mb-4 text-sm text-neutral-500">
          Each licence covers one learner — assign a single course or open up the full library. You
          choose.
        </p>
        <button
          type="button"
          onClick={onOpenBulkModal}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#F9A31A] bg-[#F9A31A]/10 px-4 py-1.5 text-sm font-medium text-[#B9760A] transition-colors hover:bg-[#F9A31A]/20"
        >
          🔥 Bulk discounts up to {maxDiscount > 0 ? `${Math.round(maxDiscount)}%` : "50%"} off
        </button>
      </div>

      <div className="mb-8 flex justify-center">
        <div className="inline-flex gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => onTabChange("licence")}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-semibold transition-all",
              tab === "licence"
                ? "bg-[#3F576F] text-white shadow-xs"
                : "bg-transparent text-neutral-500 hover:text-neutral-800",
            )}
          >
            Single Course
          </button>
          <button
            type="button"
            onClick={() => onTabChange("subscription")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all",
              tab === "subscription"
                ? "bg-[#3F576F] text-white shadow-xs"
                : "bg-transparent text-neutral-500 hover:text-neutral-800",
            )}
          >
            All Courses
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-xs font-semibold",
                tab === "subscription"
                  ? "bg-white/20 text-white"
                  : "bg-[#3F576F]/10 text-[#3F576F]",
              )}
            >
              Popular
            </span>
          </button>
        </div>
      </div>

      {quoteSuccess && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <span>✅ Quote request sent! We&apos;ll be in touch shortly.</span>
          <button
            type="button"
            onClick={onDismissQuote}
            className="text-green-700 hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
