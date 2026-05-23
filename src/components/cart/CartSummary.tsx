"use client";

import { useRouter } from "next/navigation";
import { useCartQuery } from "@/lib/hooks/useCart";
import { useCartStore } from "@/lib/stores/cart.store";

interface CartSummaryProps {
  currency?: string;
}

export function CartSummary({ currency = "£" }: CartSummaryProps) {
  const router = useRouter();
  const { data: cart } = useCartQuery();
  const totals = useCartStore((s) => s.totals);

  const t = cart ?? totals;

  if (!t) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-[#3b5374]">
            <span>Subtotal:</span>
            <span>{currency}{t.subtotal.toFixed(2)}</span>
          </div>
          {t.vat_amount > 0 && (
            <div className="flex items-center justify-between text-sm text-[#3b5374]">
              <span>VAT @ {t.vat_rate.toFixed(2)}%:</span>
              <span>{currency}{t.vat_amount.toFixed(2)}</span>
            </div>
          )}
          {t.discount > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>Discount:</span>
              <span>−{currency}{t.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between font-semibold text-[#00204a]">
              <span className="text-base uppercase tracking-wide">Total:</span>
              <span className="text-lg">{currency}{t.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push("/checkout")}
          className="mt-6 w-full rounded bg-[#9e6f21] px-6 py-4 text-base font-medium text-white transition-colors hover:bg-[#7d5819] active:bg-[#6b4c16]"
        >
          Proceed to Checkout
        </button>
      </div>

      {/* Secure payment logos placeholder */}
      <div className="flex items-center justify-center gap-2 border-t border-gray-100 px-6 py-4">
        <div className="flex items-center gap-1.5 text-xs text-[#3b5374]">
          <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
          Secure checkout
        </div>
      </div>
    </div>
  );
}
