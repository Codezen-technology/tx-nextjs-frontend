"use client";

import type { LicenceOrderSummary } from "@/types/business-pricing";

const fmt = (n: number) => `£${n.toFixed(2)}`;

interface OrderSummaryProps {
  summary: LicenceOrderSummary | null;
  vatEnabled: boolean;
  vatLabel: string;
  isLoading?: boolean;
}

export function OrderSummary({ summary, vatEnabled, vatLabel, isLoading }: OrderSummaryProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3 rounded-xl bg-neutral-100 p-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 w-full rounded bg-neutral-200" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="rounded-xl bg-neutral-100 p-5">
      <h3 className="mb-4 font-semibold text-neutral-800">Order summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>
            Subtotal ({summary.total_qty} licence{summary.total_qty !== 1 ? "s" : ""})
          </span>
          <span>{fmt(summary.subtotal)}</span>
        </div>
        {summary.discount_percent > 0 && (
          <div className="flex justify-between font-medium text-green-700">
            <span>{summary.discount_percent}% bulk discount</span>
            <span>−{fmt(summary.discount_amount)}</span>
          </div>
        )}
        {vatEnabled && summary.vat > 0 && (
          <div className="flex justify-between text-neutral-600">
            <span>{vatLabel}</span>
            <span>{fmt(summary.vat)}</span>
          </div>
        )}
        <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-base font-bold text-neutral-900">
          <span>TOTAL</span>
          <span>{fmt(summary.total)}</span>
        </div>
      </div>
      {summary.savings > 0 && (
        <div className="mt-4 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-center text-sm font-medium text-green-700">
          🎉 You saved {fmt(summary.savings)} on this order
        </div>
      )}
    </div>
  );
}
