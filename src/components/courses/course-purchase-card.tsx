"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAddToCart } from "@/lib/hooks/useCart";
import { useBulkTiers } from "@/lib/hooks/useBulkTiers";
import { resolveBulkTier, bulkTierUnitPrice } from "@/lib/utils/bulk-tiers";
import { resolveCourseProductId } from "@/lib/services/courses";
import { BulkDiscountTable } from "@/components/courses/bulk-discount-table";
import type { CourseRichData } from "@/types/course";

export function formatCoursePrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
  } catch {
    return `£${amount.toFixed(2)}`;
  }
}

type PurchaseTab = "me" | "teams";

/** Licences per order — matches the WooCommerce line-item cap. */
const MAX_QUANTITY = 999;

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(value)));
}

interface CoursePurchaseCardProps {
  course: CourseRichData;
  className?: string;
}

export function CoursePurchaseCard({ course, className }: CoursePurchaseCardProps) {
  const [tab, setTab] = useState<PurchaseTab>("me");
  const [qty, setQty] = useState(1);
  const [qtyText, setQtyText] = useState("1");
  const [addError, setAddError] = useState<string | null>(null);
  const router = useRouter();
  const { mutate: addToCartAndGo, isPending: isBuyingNow } = useAddToCart();
  const { pricing } = course;
  const { data: tiers } = useBulkTiers();

  // Indicative only — checkout re-prices server-side (see CART.md, bulk discount is a cart fee).
  const effectiveUnitPrice =
    tab === "teams" && pricing
      ? bulkTierUnitPrice(pricing.price, resolveBulkTier(tiers, qty))
      : (pricing?.price ?? 0);

  const durationLabel = course.durationLabel ? `Duration: ${course.durationLabel}` : null;

  const wcProductId = resolveCourseProductId(course);
  const canPurchase = wcProductId != null;

  /** Single rule: the priced quantity is clamped, and more than one licence means "For teams". */
  const commitQuantity = (value: number) => {
    const next = clampQuantity(value);
    setQty(next);
    if (next > 1) setTab("teams");
    return next;
  };

  /** Commit and re-sync the input text — for the steppers and for blur. */
  const applyQuantity = (value: number) => {
    setQtyText(String(commitQuantity(value)));
  };

  const selectTab = (next: PurchaseTab) => {
    setTab(next);
    // "For me" is a single licence — otherwise the header total and the cart disagree.
    if (next === "me") {
      setQty(1);
      setQtyText("1");
    }
  };

  const handleBuyNow = () => {
    if (!wcProductId) {
      setAddError("This course is not available for purchase.");
      return;
    }
    setAddError(null);
    addToCartAndGo(
      { product_id: wcProductId, quantity: qty },
      {
        onSuccess: () => {
          router.push("/checkout");
        },
        onError: (err) => {
          setAddError((err as Error).message ?? "Could not process purchase.");
        },
      },
    );
  };

  return (
    <div className={cn("w-full lg:w-76.75", className)}>
      <div className="border-neutral-30 overflow-hidden rounded-lg border bg-white shadow-xs">
        <div className="border-neutral-30 flex border-b">
          {(["me", "teams"] as PurchaseTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => selectTab(t)}
              className={cn(
                "font-open-sans flex-1 cursor-pointer py-2.5 text-base font-medium transition-colors",
                tab === t
                  ? "border-secondary-500 text-secondary-600 bg-secondary-50 border-b-2"
                  : "text-neutral-500 hover:text-neutral-700",
              )}
            >
              {t === "me" ? "For me" : "For teams"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Price row — shared by both tabs */}
          {pricing ? (
            <div className="flex items-center gap-4">
              <span className="font-suse text-[32px] leading-none font-bold text-neutral-900">
                {formatCoursePrice(effectiveUnitPrice * qty, pricing.currency)}
              </span>
              {pricing.is_on_sale && pricing.regular_price > pricing.price ? (
                <>
                  <span className="bg-neutral-30 h-10 w-px" aria-hidden />
                  <div className="font-open-sans text-sm">
                    <p className="text-neutral-500">Regular price</p>
                    <p className="font-medium text-red-500 line-through">
                      {formatCoursePrice(pricing.regular_price * qty, pricing.currency)}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <p className="font-open-sans text-sm text-neutral-600">Contact us for pricing.</p>
          )}

          {/* Qty stepper */}
          {pricing && (
            <div className="mt-2 flex w-fit items-center rounded-lg border border-neutral-50">
              <button
                type="button"
                onClick={() => {
                  const next = clampQuantity(qty - 1);
                  setQty(next);
                  setQtyText(String(next));
                  if (next === 1) setTab("me");
                }}
                aria-label="Decrease quantity"
                disabled={qty <= 1}
                className="hover:bg-neutral-10 flex h-10 w-10 items-center justify-center rounded-lg p-1 text-neutral-700 transition-colors disabled:opacity-40"
              >
                <Minus className="h-5 w-5" />
              </button>
              <input
                type="number"
                min={1}
                max={MAX_QUANTITY}
                value={qtyText}
                onChange={(e) => {
                  // Free text while typing, but commit every parsable value so the
                  // displayed total never leads the quantity sent to the cart.
                  setQtyText(e.target.value);
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) commitQuantity(val);
                }}
                onBlur={() => applyQuantity(parseInt(qtyText, 10))}
                className="font-open-sans h-10 w-12 border-x border-neutral-50 bg-white px-1 text-center text-[18px] leading-6 font-semibold text-neutral-900 outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => applyQuantity(qty + 1)}
                aria-label="Increase quantity"
                disabled={qty >= MAX_QUANTITY}
                className="hover:bg-neutral-10 flex h-10 w-10 items-center justify-center rounded-lg p-1 text-neutral-700 transition-colors disabled:opacity-40"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Bulk discount tiers — teams tab only */}
          {tab === "teams" && pricing && (
            <BulkDiscountTable unitPrice={pricing.price} currency={pricing.currency} />
          )}

          {/* CTA buttons */}
          <div className="my-4">
            {pricing && canPurchase ? (
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isBuyingNow}
                className="bg-secondary-500 font-open-sans hover:bg-secondary-600 block w-full rounded py-2.5 text-center text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBuyingNow ? "Adding…" : "Buy this course"}
              </button>
            ) : (
              <Link
                href="/contact-us"
                className="bg-secondary-500 font-open-sans hover:bg-secondary-600 block w-full rounded py-2.5 text-center text-sm font-semibold text-white transition-colors"
              >
                Get in Touch
              </Link>
            )}

            <p className="font-open-sans flex items-center justify-center gap-2 rounded-b-xs bg-[#1987541A] px-4 py-1 text-xs text-green-700">
              <Check className="h-4 w-4 text-green-600" aria-hidden />
              14 Days Money-Back Guarantee
            </p>

            {addError && (
              <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{addError}</p>
            )}
          </div>

          {/* Feature list — same for both tabs */}
          <ul className="font-open-sans space-y-2 pt-1 text-sm text-neutral-700">
            {[durationLabel, " Life Time Access", " Unlimited Free Retake Exam"]
              .filter(Boolean)
              .map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Image
                    src="/icons/check-secondary.svg"
                    alt=""
                    width={16}
                    height={16}
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  {item}
                </li>
              ))}
          </ul>

          {/* CPD Points */}
          {course.cpd_points ? (
            <div className="mt-2 flex items-center gap-2">
              <Image
                src="/icons/check-secondary.svg"
                alt=""
                width={16}
                height={16}
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
              />
              <p className="bg-secondary-50/50 font-open-sans px-2 py-1 text-base leading-6 font-bold text-neutral-500">
                CPD Points: {course.cpd_points}
              </p>
            </div>
          ) : null}

          {/* Share Section */}
          <div className="border-neutral-30 mt-4 flex items-center gap-4 border-t pt-4">
            <span className="font-open-sans text-sm text-neutral-500">Share on:</span>
            <div className="flex gap-2">
              {[
                { src: "/icons/facebook.svg", label: "Facebook" },
                { src: "/icons/linkedIn.svg", label: "LinkedIn" },
                { src: "/icons/x.svg", label: "Twitter" },
                { src: "/icons/instagram.svg", label: "Instagram" },
              ].map(({ src, label }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={`Share on ${label}`}
                  className="hover:text-primary-600 flex h-6 w-6 items-center justify-center rounded-full text-neutral-500 transition-colors"
                >
                  <Image
                    src={src}
                    alt={label}
                    width={24}
                    height={24}
                    className="h-6 w-6 cursor-pointer hover:scale-110"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
