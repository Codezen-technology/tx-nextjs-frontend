"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/hooks/useCart";
import { ExpressCheckout } from "./ExpressCheckout";
import { cn } from "@/lib/utils/cn";
import parse from "html-react-parser";
import Image from "next/image";

interface CartSummaryProps {
  currency?: string;
  onSuccess?: (orderId: number, orderKey: string) => void;
}

export function CartSummary({ currency = "£", onSuccess }: CartSummaryProps) {
  const router = useRouter();
  const { totals: t, currency: cartCurrency } = useCart();
  const displayCurrency = parse(cartCurrency ?? currency);
  if (!t) return null;

  return (
    <div className="border-secondary-100 bg-secondary-50 rounded-lg border shadow-xs">
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
          <div className="border-secondary-100 border-t pt-3">
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

        {onSuccess && <ExpressCheckout onSuccess={onSuccess} />}
      </div>

      {/* The design puts its trust band here (6239:113976), beneath the checkout
          button.

          ⚠️ Divergence from `openspec/specs/purchase-trust-signals`: this renders
          the flat artwork rather than `<SecureCheckoutBand />`, which checkout
          still uses. The band derives its card marks from `CARD_BRANDS`; a raster
          cannot, so the two surfaces can now claim different accepted brands and
          only the checkout one stays true when `CARD_BRANDS` changes. Swap back to
          the band, or re-cut the artwork, once the design owner has ruled. */}
      <div className="px-6 pb-6">
        <Image
          src="/images/payment-div.png"
          alt="Guaranteed safe and secure checkout, powered by Stripe"
          width={400}
          height={86}
        />
      </div>
    </div>
  );
}
