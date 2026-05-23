"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Facebook, Linkedin, Share2, Twitter } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAddToCart } from "@/lib/hooks/useCart";
import type { CourseRichData } from "@/types/course";

type PurchaseTab = "me" | "teams";

interface CoursePurchaseCardProps {
  course: CourseRichData;
  className?: string;
}

export function CoursePurchaseCard({ course, className }: CoursePurchaseCardProps) {
  const [tab, setTab] = useState<PurchaseTab>("me");
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const router = useRouter();
  const { mutate: addToCart, mutateAsync: addToCartAsync, isPending } = useAddToCart();
  const { pricing } = course;

  const durationLabel = course.duration
    ? `Duration ${(course.duration as { value: number; unit: string }).value} ${(course.duration as { value: number; unit: string }).unit}`
    : null;

  const handleAddToBasket = () => {
    setAddError(null);
    addToCart(
      { product_id: course.id },
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

  const handleBuyNow = async () => {
    setAddError(null);
    try {
      await addToCartAsync({ product_id: course.id });
    } catch {
      // If add fails (e.g. already in cart), proceed to checkout anyway.
    }
    router.push("/checkout");
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

        <div className="space-y-5 p-6">
          {tab === "me" ? (
            <>
              {pricing ? (
                <div className="flex items-center gap-4">
                  <span
                    className="font-suse text-[32px] font-bold leading-none text-neutral-900"
                    dangerouslySetInnerHTML={{ __html: pricing.price_html }}
                  />
                  <span className="h-10 w-px bg-neutral-30" aria-hidden />
                  <div className="font-open-sans text-sm">
                    <p className="text-neutral-500">Regular price</p>
                    {pricing.is_on_sale && pricing.regular_price > pricing.price ? (
                      <p className="font-medium text-neutral-700 line-through">
                        £{pricing.regular_price.toFixed(2)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="font-open-sans text-sm text-neutral-600">Contact us for pricing.</p>
              )}

              <div className="space-y-3">
                {pricing ? (
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={isPending}
                    className="block w-full rounded bg-secondary-500 py-2.5 text-center font-open-sans text-sm font-semibold text-white transition-colors hover:bg-secondary-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "Adding…" : "Buy Now"}
                  </button>
                ) : (
                  <Link
                    href="/contact"
                    className="block w-full rounded bg-secondary-500 py-2.5 text-center font-open-sans text-sm font-semibold text-white transition-colors hover:bg-secondary-600"
                  >
                    Get in Touch
                  </Link>
                )}

                {pricing && (
                  <button
                    type="button"
                    onClick={handleAddToBasket}
                    disabled={isPending || addedFeedback}
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
                    ) : isPending ? (
                      "Adding…"
                    ) : (
                      "Add to Basket"
                    )}
                  </button>
                )}

                {addError && (
                  <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{addError}</p>
                )}

                <p className="flex items-center justify-center gap-2 font-open-sans text-xs text-neutral-600">
                  <Check className="h-4 w-4 text-secondary-500" aria-hidden />
                  14 Days Money-Back Guarantee
                </p>
              </div>

              <ul className="space-y-2 border-t border-neutral-30 pt-4 font-open-sans text-sm text-neutral-700">
                {[durationLabel, "Life Time Access", "Unlimited Free Retake Exam"]
                  .filter(Boolean)
                  .map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary-500" />
                      {item}
                    </li>
                  ))}
                {course.cpd_points ? (
                  <li className="flex items-center gap-2 pt-1">
                    <Check className="h-4 w-4 shrink-0 text-secondary-500" />
                    <span className="rounded bg-primary-50 px-2 py-1 text-sm font-medium text-primary-800">
                      CPD Points: {course.cpd_points}
                    </span>
                  </li>
                ) : null}
              </ul>

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
            </>
          ) : (
            <div className="space-y-4 py-2 text-center">
              <Share2 className="mx-auto h-10 w-10 text-neutral-300" />
              <h3 className="font-suse font-bold text-neutral-900">Team Training</h3>
              <p className="font-open-sans text-sm text-neutral-600">
                Volume discounts and centralised reporting for teams of 5 or more.
              </p>
              <Link
                href="/contact?enquiry=teams"
                className="block w-full rounded bg-secondary-500 py-2.5 text-center font-open-sans text-sm font-semibold text-white hover:bg-secondary-600"
              >
                Get a Team Quote
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
