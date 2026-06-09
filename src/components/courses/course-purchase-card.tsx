"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Facebook, Linkedin, Twitter } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAddToCart } from "@/lib/hooks/useCart";
import { resolveCourseProductId } from "@/lib/services/courses";
import type { CourseRichData } from "@/types/course";

function formatCoursePrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
  } catch {
    return `£${amount.toFixed(2)}`;
  }
}

type PurchaseTab = "me" | "teams";

interface CoursePurchaseCardProps {
  course: CourseRichData;
  className?: string;
}

export function CoursePurchaseCard({ course, className }: CoursePurchaseCardProps) {
  const [tab, setTab] = useState<PurchaseTab>("me");
  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const router = useRouter();
  const { mutate: addToBasket, isPending: isAddingToBasket } = useAddToCart();
  const { mutate: addToCartAndGo, isPending: isBuyingNow } = useAddToCart();
  const { pricing } = course;

  const durationLabel = course.duration
    ? `Duration ${(course.duration as { value: number; unit: string }).value} ${(course.duration as { value: number; unit: string }).unit}`
    : null;

  const wcProductId = resolveCourseProductId(course);
  const canPurchase = wcProductId != null;

  const handleAddToBasket = () => {
    if (!wcProductId) {
      setAddError("This course is not available for purchase.");
      return;
    }
    setAddError(null);
    addToBasket(
      { product_id: wcProductId },
      {
        onSuccess: () => {
          setAddedFeedback(true);
          setTimeout(() => setAddedFeedback(false), 2500);
        },
        onError: (err) => {
          setAddError((err as Error).message ?? "Could not add to basket.");
        },
      },
    );
  };

  const handleBuyNow = () => {
    if (!wcProductId) {
      setAddError("This course is not available for purchase.");
      return;
    }
    setAddError(null);
    addToCartAndGo(
      { product_id: wcProductId, quantity: tab === "teams" ? qty : 1 },
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
    <div className={cn("w-full lg:w-[307px]", className)}>
      <div className="overflow-hidden rounded-lg border border-neutral-30 bg-white shadow-sm">
        <div className="flex border-b border-neutral-30">
          {(["me", "teams"] as PurchaseTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2.5 font-open-sans text-base font-medium transition-colors",
                tab === t
                  ? "border-b-2 border-secondary-500 text-secondary-600"
                  : "text-neutral-500 hover:text-neutral-700",
              )}
            >
              {t === "me" ? "For me" : "For teams"}
            </button>
          ))}
        </div>

        <div className="space-y-4 p-6">
          {/* Price row — shared by both tabs */}
          {pricing ? (
            <div className="flex items-center gap-4">
              <span className="font-suse text-[32px] font-bold leading-none text-neutral-900">
                {formatCoursePrice(pricing.price * (tab === "teams" ? qty : 1), pricing.currency)}
              </span>
              {pricing.is_on_sale && pricing.regular_price > pricing.price ? (
                <>
                  <span className="h-10 w-px bg-neutral-30" aria-hidden />
                  <div className="font-open-sans text-sm">
                    <p className="text-neutral-500">Regular price</p>
                    <p className="font-medium text-red-500 line-through">
                      {formatCoursePrice(
                        pricing.regular_price * (tab === "teams" ? qty : 1),
                        pricing.currency,
                      )}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <p className="font-open-sans text-sm text-neutral-600">Contact us for pricing.</p>
          )}

          {/* Qty stepper — teams tab only */}
          {tab === "teams" && pricing && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                disabled={qty <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-30 font-open-sans text-lg text-neutral-700 transition-colors hover:bg-neutral-10 disabled:opacity-40"
              >
                −
              </button>
              <span className="w-8 text-center font-open-sans text-base font-medium text-neutral-900">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-30 font-open-sans text-lg text-neutral-700 transition-colors hover:bg-neutral-10"
              >
                +
              </button>
            </div>
          )}

          {/* CTA buttons */}
          <div className="space-y-3">
            {pricing && canPurchase ? (
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isBuyingNow || isAddingToBasket}
                className="block w-full rounded bg-secondary-500 py-2.5 text-center font-open-sans text-sm font-semibold text-white transition-colors hover:bg-secondary-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBuyingNow ? "Adding…" : "Buy this course"}
              </button>
            ) : (
              <Link
                href="/contact"
                className="block w-full rounded bg-secondary-500 py-2.5 text-center font-open-sans text-sm font-semibold text-white transition-colors hover:bg-secondary-600"
              >
                Get in Touch
              </Link>
            )}

            <p className="flex items-center justify-center gap-2 font-open-sans text-xs text-neutral-600">
              <Check className="h-4 w-4 text-secondary-500" aria-hidden />
              14 Days Money-Back Guarantee
            </p>

            {tab === "me" && pricing && (
              <button
                type="button"
                onClick={handleAddToBasket}
                disabled={isAddingToBasket || isBuyingNow || addedFeedback || !canPurchase}
                className={cn(
                  "block w-full rounded border py-2.5 text-center font-open-sans text-sm font-semibold transition-colors disabled:cursor-not-allowed",
                  addedFeedback
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-neutral-30 text-neutral-800 hover:bg-neutral-10 disabled:opacity-60",
                )}
              >
                {addedFeedback ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Check className="h-4 w-4" />
                    Added to Basket
                  </span>
                ) : isAddingToBasket ? (
                  "Adding…"
                ) : (
                  "Add to Basket"
                )}
              </button>
            )}

            {addError && (
              <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{addError}</p>
            )}
          </div>

          {/* Feature list — same for both tabs */}
          <ul className="space-y-2 border-t border-neutral-30 pt-4 font-open-sans text-sm text-neutral-700">
            {[
              "100% online & self-paced learning",
              durationLabel,
              course.cpd_points ? `CPD Points: ${course.cpd_points}` : null,
              "Free Digital Certificate",
            ]
              .filter(Boolean)
              .map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary-500" />
                  {item}
                </li>
              ))}
          </ul>

          {tab === "me" && (
            <div className="flex items-center gap-4 border-t border-neutral-30 pt-4">
              <span className="font-open-sans text-sm text-neutral-600">Share on:</span>
              <div className="flex gap-2">
                {[
                  { Icon: Facebook, label: "Facebook" },
                  { Icon: Linkedin, label: "LinkedIn" },
                  { Icon: Twitter, label: "Twitter" },
                ].map(({ Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={`Share on ${label}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-500 transition-colors hover:text-primary-600"
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
