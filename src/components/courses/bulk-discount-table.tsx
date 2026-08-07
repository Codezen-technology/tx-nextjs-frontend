"use client";

import { useBulkTiers } from "@/lib/hooks/useBulkTiers";
import { cn } from "@/lib/utils/cn";
import type { BulkTier } from "@/types/cart-rules";

interface BulkDiscountTableProps {
  /** Per-unit price the tier percentages discount from. */
  unitPrice: number;
  currency?: string;
  className?: string;
}

function tierLabel(tier: BulkTier): string {
  return tier.max > 0 ? `${tier.min} - ${tier.max} users` : `${tier.min}+ users`;
}

export function BulkDiscountTable({
  unitPrice,
  currency = "£",
  className,
}: BulkDiscountTableProps) {
  const { data: tiers, isLoading } = useBulkTiers();

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
          return (
            <div key={i} className="flex items-center justify-between">
              <span className="font-open-sans flex w-25.25 items-center gap-2 text-[14px] font-semibold text-neutral-500">
                {tierLabel(tier)}
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
