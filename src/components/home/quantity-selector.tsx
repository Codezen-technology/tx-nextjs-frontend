"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { HomePricingPlan } from "@/types/home";
import { cn } from "@/lib/utils/cn";
import { PricingCta } from "./pricing-cta";

interface QuantitySelectorProps {
  plan: HomePricingPlan;
}

export function QuantitySelector({ plan }: QuantitySelectorProps) {
  const [qty, setQty] = useState(1);

  const ctaClassName = cn(
    "font-open-sans flex h-10 items-center justify-center rounded-full text-sm font-medium transition-transform hover:scale-105 cursor-pointer",
    plan.variant === "default" && "border-secondary-500 text-secondary-500 border bg-transparent",
    plan.variant === "beige" && "bg-secondary-500 text-white",
    plan.variant === "navy" && "border-primary-500 border text-base font-bold text-neutral-900",
  );

  const ctaStyle =
    plan.variant === "navy"
      ? { background: "linear-gradient(90deg, #00bbf0, #8AE0F8)" }
      : undefined;

  return (
    <div className="flex flex-col gap-4">
      {/* Price & Quantity */}
      <div className="flex flex-row justify-between gap-2">
        <div className="flex items-baseline gap-2">
          {plan.originalPrice && (
            <span className="text-xl font-bold text-[#dc3545] line-through">
              {plan.originalPrice}
            </span>
          )}
          <span
            className={cn(
              "font-suse font-bold",
              plan.variant === "navy" ? "text-white" : "text-neutral-900",
            )}
          >
            <span className="text-2xl">{plan.price}</span>
            {plan.priceUnit && <span className="text-base">{plan.priceUnit}</span>}
          </span>
        </div>
        {plan.variant !== "navy" && (
          <div className="qty-selector flex items-center rounded-md border border-neutral-50">
            <button
              type="button"
              className="qty-btn flex size-10 cursor-pointer items-center justify-center"
              aria-label="Decrease quantity"
              disabled={qty <= 1}
              onClick={() => setQty((quantity) => Math.max(1, quantity - 1))}
            >
              <Minus className="h-5 w-5 text-neutral-900" />
            </button>
            <div className="qty-value flex h-10 w-12 items-center justify-center border-x border-neutral-50">
              <span className="font-open-sans text-lg font-semibold text-neutral-900">{qty}</span>
            </div>
            <button
              type="button"
              className="qty-btn flex size-10 cursor-pointer items-center justify-center"
              aria-label="Increase quantity"
              disabled={qty >= 200}
              onClick={() => setQty((quantity) => Math.min(200, quantity + 1))}
            >
              <Plus className="h-5 w-5 text-neutral-900" />
            </button>
          </div>
        )}
      </div>

      {/* CTA */}
      <PricingCta plan={plan} quantity={qty} className={ctaClassName} style={ctaStyle} />
    </div>
  );
}
