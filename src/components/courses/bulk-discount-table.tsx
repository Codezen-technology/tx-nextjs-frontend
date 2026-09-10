"use client";

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
      <div className="font-open-sans flex items-center justify-between rounded-t bg-[#f5f6f8] px-2 py-1.5 text-[14px] font-semibold text-neutral-900">
        <span className="w-25.25">Quantity</span>
        <span className="text-center">Save</span>
        <div className="w-14.5 text-center leading-tight">
          <span className="block">Price</span>
          <span className="block text-[10px] font-normal">(per person)</span>
        </div>
      </div>
      <div className="flex flex-col rounded-b border border-[#f5f6f8]">
        {tiers.map((tier, i) => {
          const price = unitPrice * (1 - tier.percentage / 100);
          const isActive = tier === activeTier;
          return (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between px-2 py-2",
                i < tiers.length - 1 && "border-b border-[#f5f6f8]",
              )}
            >
              <span
                className={cn(
                  "font-open-sans w-25.25 text-[14px]",
                  isActive ? "font-bold text-neutral-900" : "font-semibold text-neutral-500",
                )}
              >
                {tierLabel(tier)}
              </span>
              <span className="rounded-full bg-[#eaf2ec] px-2 py-0.5 text-[12px] leading-4 font-bold text-[#4f9254]">
                {tier.percentage}%
              </span>
              <span className="font-open-sans w-14.5 text-right text-[14px] font-bold text-neutral-900">
                {new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(price)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
