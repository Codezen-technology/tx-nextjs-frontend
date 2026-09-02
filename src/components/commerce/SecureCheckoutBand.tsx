import { Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CardBrandMarks } from "./CardBrandMarks";

/**
 * The trust band beneath the control that commits a purchase — `image 24` in the
 * design, 120px tall on Checkout (6239:134737) and 86px in the Cart summary
 * (6239:113976). It is the section QA-CHECK-D1 filed as missing and the half of
 * QA-CHECK-A5 that shipped unread, because in the frame it is a flat raster whose
 * contents could not be measured; rendered, it reads: lock + "Guaranteed safe &
 * secure checkout", the processor badge, a rule, then the card marks.
 *
 * ⚠️ The artwork draws seven brands — Visa, Mastercard, Amex, JCB, Discover,
 * Diners Club and UnionPay — while the design's own payment-method row
 * (6239:134680) draws four. This renders `CARD_BRANDS`, the same four every other
 * surface reads, for the reason QA-CHECK-A3 settled: a card mark is a claim about
 * what the gateway will take, and the one screen where a false acceptance claim
 * costs a failed payment is this one. If Stripe genuinely accepts the other
 * three, that is one edit to `CARD_BRANDS` and every surface follows.
 *
 * The "Powered by Stripe" chip is set as text. `image 24` is a single image fill,
 * so Stripe's badge cannot be exported from it — only cropped out of a bitmap —
 * and setting a wordmark in a substitute typeface approximates a trademark. Drop
 * Stripe's published SVG in `public/icons/payment/` to swap it in.
 */
export function SecureCheckoutBand({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-neutral-30 flex flex-col items-center gap-3 rounded-lg border bg-white px-4 py-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="font-open-sans flex items-center gap-2 text-sm text-neutral-700">
          <Lock size={16} className="text-neutral-900" aria-hidden />
          <span>
            Guaranteed <strong className="font-semibold text-neutral-900">safe &amp; secure</strong>{" "}
            checkout
          </span>
        </span>
        <span className="rounded bg-neutral-900 px-2 py-1 text-[11px] font-medium text-white">
          Powered by Stripe
        </span>
      </div>

      <div className="border-neutral-30 w-full border-t" />

      <CardBrandMarks />
    </div>
  );
}
