"use client";

import { Check } from "lucide-react";
import { useBulkTiers } from "@/lib/hooks/useBulkTiers";
import { resolveBulkTier } from "@/lib/utils/bulk-tiers";
import { cn } from "@/lib/utils/cn";
import type { BulkTier } from "@/types/cart-rules";

interface BulkDiscountTableProps {
  /** Per-unit price the tier percentages discount from. */
  unitPrice: number;
  /**
   * Current licence quantity. Drives which row is marked active — the row the buyer's
   * quantity has actually reached, so the table explains the headline total rather than
   * listing five bands that all look equally hypothetical.
   */
  quantity: number;
  currency?: string;
  className?: string;
}

function tierLabel(tier: BulkTier): string {
  return tier.max > 0 ? `${tier.min} - ${tier.max} users` : `${tier.min}+ users`;
}

export function BulkDiscountTable({
  unitPrice,
  quantity,
  currency = "£",
  className,
}: BulkDiscountTableProps) {
  const { data: tiers, isLoading } = useBulkTiers();

  // Same resolver the card uses for the header price. Tiers may overlap or arrive
  // unsorted and the largest discount wins, so re-deriving the match here would
  // disagree with the headline total on exactly the inputs that rule exists for.
  const activeTier = resolveBulkTier(tiers, quantity);

  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-neutral-20 h-10 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!tiers || tiers.length === 0) return null;

  return (
    <div className={cn("mt-4 flex flex-col", className)}>
      <div className="bg-neutral-40 font-open-sans flex items-center justify-between px-2 py-1.5 text-[14px] font-semibold text-neutral-900">
        {/* Matches the rows' marker slot so the header sits over the band labels. */}
        <span className="w-5 shrink-0" aria-hidden />
        <span className="w-25.25">Quantity</span>
        <span>Save</span>
        <div className="w-14.5 text-center leading-tight">
          <span className="block">Price</span>
          <span className="block text-[10px] font-normal">(per person)</span>
        </div>
      </div>
      <div className="bg-neutral-20 flex flex-col gap-4 px-2.5 py-3">
        {tiers.map((tier, i) => {
          const price = unitPrice * (1 - tier.percentage / 100);
          // Identity, not a min/max re-match: two configured tiers can share a band
          // with different percentages, and only one of them priced this order.
          const isActive = tier === activeTier;
          return (
            <div
              key={i}
              // `-mx-1 px-1` gives the active tint some breathing room without moving any
              // column: every row keeps the same content box, highlighted or not.
              className={cn(
                "-mx-1 flex items-center justify-between rounded px-1 py-0.5",
                isActive && "bg-secondary-50",
              )}
              aria-current={isActive ? "true" : undefined}
            >
              {/* Non-colour cue — the highlight must survive greyscale. The slot is
                  reserved on every row (and in the header) so nothing shifts. */}
              <span className="w-5 shrink-0">
                <Check
                  className={cn("h-3.5 w-3.5", isActive ? "text-secondary-600" : "invisible")}
                  aria-hidden
                />
              </span>
              <span
                className={cn(
                  "font-open-sans w-25.25 text-[14px]",
                  isActive ? "font-bold text-neutral-900" : "font-semibold text-neutral-500",
                )}
              >
                {tierLabel(tier)}
                {isActive ? <span className="sr-only"> — your current tier</span> : null}
              </span>
              <span className="rounded-[20px] bg-neutral-700 px-2 py-0.5 text-[12px] leading-4 font-bold text-white">
                {tier.percentage}%
              </span>
              <span className="font-open-sans w-14.5 text-right text-[14px] font-bold text-neutral-900">
                {currency}
                {price.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
