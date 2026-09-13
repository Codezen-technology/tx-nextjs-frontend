"use client";

import { useBulkTiers } from "@/lib/hooks/useBulkTiers";
import { resolveBulkTier } from "@/lib/utils/bulk-tiers";
import { formatCurrencyAmount } from "@/lib/utils/price";
import { cn } from "@/lib/utils/cn";
import { SavingsPill } from "@/components/courses/savings-pill";
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
  currency,
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
      <div className="bg-neutral-20 font-open-sans flex items-center justify-between rounded-t px-2 py-1.5 text-[14px] font-semibold text-neutral-900">
        <span className="w-25.25">Quantity</span>
        <span className="text-center">Save</span>
        <div className="w-14.5 text-center leading-tight">
          <span className="block">Price</span>
          <span className="block text-[10px] font-normal">(per person)</span>
        </div>
      </div>
      <div className="border-neutral-20 flex flex-col rounded-b border">
        {tiers.map((tier, i) => {
          const price = unitPrice * (1 - tier.percentage / 100);
          // Identity, not a min/max re-match: two configured tiers can share a band
          // with different percentages, and only one of them priced this order.
          const isActive = tier === activeTier;
          return (
            <div
              key={i}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "flex items-center justify-between px-2 py-2",
                i < tiers.length - 1 && "border-neutral-20 border-b",
              )}
            >
              <span
                className={cn(
                  "font-open-sans w-25.25 text-[14px]",
                  isActive ? "font-bold text-neutral-900" : "font-semibold text-neutral-500",
                )}
              >
                {tierLabel(tier)}
                {/* Non-colour cue — the active row must still be identifiable in
                    greyscale and to a screen reader, which weight alone does not do. */}
                {isActive ? <span className="sr-only"> — your current tier</span> : null}
              </span>
              <SavingsPill>{tier.percentage}%</SavingsPill>
              <span className="font-open-sans w-14.5 text-right text-[14px] font-bold text-neutral-900">
                {formatCurrencyAmount(price, currency)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
