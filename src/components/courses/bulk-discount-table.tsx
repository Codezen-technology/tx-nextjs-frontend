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
          <div key={i} className="h-10 animate-pulse rounded bg-neutral-20" />
        ))}
      </div>
    );
  }

  if (!tiers || tiers.length === 0) return null;

  return (
    <div className={cn("overflow-hidden rounded-xl border border-[#ebedf1]", className)}>
      <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-primary-50 px-4 py-2.5 font-open-sans text-xs font-semibold uppercase tracking-wide text-primary-700">
        <span>Quantity</span>
        <span className="text-right">Price</span>
        <span className="text-right">Bulk Discount</span>
      </div>
      {tiers.map((tier, i) => {
        const price = unitPrice * (1 - tier.percentage / 100);
        return (
          <div
            key={i}
            className="grid grid-cols-[1.2fr_1fr_1fr] items-center border-t border-[#ebedf1] px-4 py-3 font-open-sans text-sm"
          >
            <span className="inline-flex items-center gap-1.5 text-neutral-700">
              <Users className="h-3.5 w-3.5 text-primary-500" />
              {tierLabel(tier)}
            </span>
            <span className="text-right font-bold text-neutral-900">
              {currency}
              {price.toFixed(2)}
            </span>
            <span className="text-right font-semibold text-secondary-600">
              Save {tier.percentage}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
