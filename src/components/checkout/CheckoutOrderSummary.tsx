"use client";

import { useCart } from "@/lib/hooks/useCart";
import { ParsedHtml } from "@/components/ui/parsed-html";

export function CheckoutOrderSummary() {
  const { items, totals, currency } = useCart();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <span className="font-semibold text-neutral-900">Product</span>
        <span className="font-semibold text-neutral-900">Subtotal</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-start justify-between gap-4 text-sm text-neutral-500"
          >
            <span className="flex-1">
              <ParsedHtml as="span" content={item.name} />{" "}
              <span className="text-neutral-900">× {item.quantity}</span>
            </span>
            <span className="shrink-0 font-medium">
              {currency}
              {item.line_total.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {totals && (
        <div className="space-y-2 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between text-sm font-semibold text-neutral-900">
            <span>Subtotal</span>
            <span>
              {currency}
              {totals.subtotal.toFixed(2)}
            </span>
          </div>
          {totals.discount > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>
                −{currency}
                {totals.discount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2">
            <div className="flex items-center justify-between font-semibold text-neutral-900">
              <span>Total (pay today)</span>
              <span className="text-base">
                {currency}
                {totals.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
