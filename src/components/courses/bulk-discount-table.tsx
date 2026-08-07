"use client";

import { Users } from "lucide-react";
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
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-neutral-20 h-10 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!tiers || tiers.length === 0) return null;

  return (
    <div className={cn("border-neutral-30 overflow-hidden rounded-xl border", className)}>
      <div className="bg-primary-50 font-open-sans text-primary-700 grid grid-cols-[1.2fr_1fr_1fr] px-4 py-2.5 text-xs font-semibold tracking-wide uppercase">
        <span>Quantity</span>
        <span className="text-right">Price</span>
        <span className="text-right">Bulk Discount</span>
      </div>
      {tiers.map((tier, i) => {
        const price = unitPrice * (1 - tier.percentage / 100);
        return (
          <div
            key={i}
            className="border-neutral-30 font-open-sans grid grid-cols-[1.2fr_1fr_1fr] items-center border-t px-4 py-3 text-sm"
          >
            <span className="inline-flex items-center gap-1.5 text-neutral-700">
              <Users className="text-primary-500 h-3.5 w-3.5" />
              {tierLabel(tier)}
            </span>
            <span className="text-right font-bold text-neutral-900">
              {currency}
              {price.toFixed(2)}
            </span>
            <span className="text-secondary-600 text-right font-semibold">
              Save {tier.percentage}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
