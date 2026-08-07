"use client";

import { Loader2 } from "lucide-react";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SubOrderSummaryProps {
  seatQty: number;
  subBasePrice: number;
  subDiscount: number;
  subDiscountAmt: number;
  subSubtotal: number;
  subVat: number;
  subTotal: number;
  subCheckoutLoading: boolean;
  disabled: boolean;
  vatEnabled: boolean;
  vatLabel: string;
  onCheckout: () => void;
  onQuote: () => void;
  onContact: () => void;
}

export function SubOrderSummary({
  seatQty,
  subBasePrice,
  subDiscount,
  subDiscountAmt,
  subSubtotal,
  subVat,
  subTotal,
  subCheckoutLoading,
  disabled,
  vatEnabled,
  vatLabel,
  onCheckout,
  onQuote,
  onContact,
}: SubOrderSummaryProps) {
  const discountedPerSeat = seatQty > 0 ? (subSubtotal - subDiscountAmt) / seatQty : 0;
  const monthlyPerSeat = discountedPerSeat / 12;

  return (
    <div className="shrink-0 lg:w-72">
      <div className="mb-3 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-700">Order summary</p>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-400">
            Billed annually
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>
              {seatQty} seat{seatQty !== 1 ? "s" : ""} × £{subBasePrice.toFixed(2)}
            </span>
            <span>£{subSubtotal.toFixed(2)}</span>
          </div>
          {subDiscount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Discount ({subDiscount}%)</span>
              <span>−£{subDiscountAmt.toFixed(2)}</span>
            </div>
          )}
          {vatEnabled && subVat > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>{vatLabel}</span>
              <span>£{subVat.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-200 pt-2 font-bold text-neutral-900">
            <span>TOTAL / year</span>
            <span>£{subTotal.toFixed(2)}</span>
          </div>
          <p className="text-right text-xs text-neutral-400">
            ≈ £{monthlyPerSeat.toFixed(2)}/mo per seat
          </p>
        </div>
        {subDiscount > 0 && (
          <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
            <span className="text-sm text-green-700">✓</span>
            <span className="text-xs font-medium text-green-700">
              You save £{subDiscountAmt.toFixed(2)}/year ({subDiscount}% bulk discount)
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onQuote}
        className="mb-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
      >
        Request a quote
      </button>
      <button
        type="button"
        onClick={onCheckout}
        disabled={subCheckoutLoading || disabled}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3F576F] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#33485d] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {subCheckoutLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "🔒 Continue to checkout"
        )}
      </button>
      {vatEnabled && subVat > 0 && (
        <p className="mt-2 text-center text-xs text-neutral-400">{vatLabel}. Outside the UK?</p>
      )}
      <button
        type="button"
        onClick={onContact}
        className="mt-1 w-full rounded-lg bg-[#F9A31A] py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e89410]"
      >
        Contact us
      </button>
    </div>
  );
}

export function SubContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useSiteSettings();
  const email = settings?.contact_email ?? "";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#F9A31A]/40 text-2xl">
            🌐
          </div>
          <DialogTitle>Contact us</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-neutral-500">
          Have a question about your order, VAT, or need a custom quote? Reach us at:
        </p>
        {email ? (
          <a
            href={`mailto:${email}`}
            className="font-semibold break-all text-[#3F576F] hover:underline"
          >
            {email}
          </a>
        ) : (
          <p className="text-sm text-neutral-400">Contact email not configured.</p>
        )}
        <Button onClick={onClose} className="mt-2 w-full bg-[#3F576F] hover:bg-[#33485d]">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
