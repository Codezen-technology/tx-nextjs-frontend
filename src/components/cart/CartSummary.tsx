"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/hooks/useCart";
import { SecureCheckoutBand } from "@/components/commerce/SecureCheckoutBand";
import { cn } from "@/lib/utils/cn";
import parse from "html-react-parser";

interface CartSummaryProps {
  currency?: string;
}

export function CartSummary({ currency = "£" }: CartSummaryProps) {
  const router = useRouter();
  const { totals: t, currency: cartCurrency } = useCart();
  const displayCurrency = parse(cartCurrency ?? currency);
  if (!t) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-xs">
      <div className="p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>Subtotal:</span>
            <span>
              {displayCurrency}
              {t.subtotal.toFixed(2)}
            </span>
          </div>
          {t.vat_amount > 0 && (
            <div className="flex items-center justify-between text-sm text-neutral-500">
              <span>VAT @ {t.vat_rate}%:</span>
              <span>
                {displayCurrency}
                {t.vat_amount.toFixed(2)}
              </span>
            </div>
          )}
          {t.fees.map((fee) => (
            <div
              key={fee.key}
              className={cn(
                "flex items-center justify-between text-sm",
                fee.amount < 0 ? "text-green-600" : "text-neutral-500",
              )}
            >
              <span>{fee.name}:</span>
              <span>
                {fee.amount < 0 ? "−" : ""}
                {displayCurrency}
                {Math.abs(fee.amount).toFixed(2)}
              </span>
            </div>
          ))}
          {t.discount > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>Coupon{t.coupon_code ? ` (${t.coupon_code.toUpperCase()})` : ""}:</span>
              <span>
                −{displayCurrency}
                {t.discount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between font-semibold text-neutral-900">
              <span className="text-base tracking-wide uppercase">Total:</span>
              <span className="text-lg">
                {displayCurrency}
                {t.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push("/checkout")}
          className="bg-secondary-600 mt-6 w-full rounded px-6 py-4 text-base font-medium text-white transition-colors hover:bg-[#7d5819] active:bg-[#6b4c16]"
        >
          Proceed to Checkout
        </button>
      </div>

      {/* The design puts its trust band here too (6239:113976), beneath the
          checkout button. This replaced a hand-rolled "Secure checkout" line with
          its own shield and its own idea of which brands the site takes — the
          band reads the shared brand list, so the cart cannot disagree with the
          checkout page about what is accepted. */}
      <div className="px-6 pb-6">
        <SecureCheckoutBand />
      </div>
    </div>
  );
}
