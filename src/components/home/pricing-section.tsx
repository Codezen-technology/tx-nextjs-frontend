import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomePricingSection } from "@/types/home";
import { cn } from "@/lib/utils/cn";
import { QuantitySelector } from "./quantity-selector";

interface PricingSectionProps {
  data?: HomePricingSection;
}

export function PricingSection({ data }: PricingSectionProps) {
  if (!data?.plans?.length) return null;

  const { header, plans } = data;

  return (
    <section className="py-section bg-white lg:py-20">
      <div className="container mx-auto">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="font-suse text-2xl font-bold text-neutral-900 md:text-[32px]">
              {header.title}
            </h2>
            <p className="font-open-sans text-base text-neutral-500">{header.description}</p>
          </div>
          <Link
            href={header.ctaHref}
            className="font-open-sans text-secondary-500 hover:text-secondary-600 inline-flex shrink-0 items-center gap-2 text-base font-medium transition-colors"
          >
            {header.ctaLabel}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className="relative">
              {plan.badge === "most-popular" && (
                <div className="absolute -top-4 right-6 z-20 flex items-start">
                  <div className="text-secondary-500 relative rounded-b-lg bg-white p-4 text-sm font-medium shadow-md">
                    Most Popular
                    <svg
                      className="absolute top-0 -right-3"
                      xmlns="http://www.w3.org/2000/svg"
                      width={12}
                      height={18}
                      viewBox="0 0 12 16"
                      fill="none"
                    >
                      <path d="M12 15.0588H0V0L12 15.0588Z" fill="#E1D2BA" />
                    </svg>
                  </div>
                </div>
              )}

              {plan.badge === "best-value" && (
                <div className="absolute -top-4 right-6 z-20 flex items-start">
                  <div
                    className="relative rounded-b-lg p-4 text-sm font-medium text-neutral-900 shadow-md"
                    style={{ background: "linear-gradient(85deg, #01aee0 0%, #00c7ff 100%)" }}
                  >
                    Best Value
                    <svg
                      className="absolute top-0 -right-3"
                      xmlns="http://www.w3.org/2000/svg"
                      width={12}
                      height={18}
                      viewBox="0 0 12 16"
                      fill="none"
                    >
                      <path d="M12 15.0588H0V0L12 15.0588Z" fill="#0085aa" />
                    </svg>
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "relative flex h-full flex-col gap-6 overflow-hidden rounded-lg p-8",
                  plan.variant === "default" && "border-neutral-30 border bg-white shadow-xs",
                  plan.variant === "beige" && "border-neutral-30 border shadow-xs",
                  plan.variant === "navy" && "border-transparent shadow-lg",
                )}
                style={
                  plan.variant === "beige"
                    ? { background: "linear-gradient(210.15deg, #f5f1e9 14.85%, #e1d2ba 96.39%)" }
                    : plan.variant === "navy"
                      ? { background: "linear-gradient(30.18deg, #00204a 9.18%, #1c395e 92.41%)" }
                      : undefined
                }
              >
                {plan.variant === "navy" && (
                  <div
                    className="pointer-events-none absolute inset-0 bg-[url('/images/plus-shape.png')] bg-contain bg-right bg-no-repeat"
                    aria-hidden="true"
                  />
                )}

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4">
                    {/* Plan Name & Subtitle */}
                    <div className="flex flex-col gap-2">
                      <p
                        className={cn(
                          "font-suse text-xl font-bold",
                          plan.variant === "default" && "text-neutral-900",
                          plan.variant === "beige" && "text-secondary-500",
                          plan.variant === "navy" && "text-primary-500",
                        )}
                      >
                        {plan.name}
                      </p>
                      {plan.subtitle && (
                        <p
                          className={cn(
                            "font-open-sans text-base",
                            plan.variant === "navy" && "text-white",
                            plan.variant !== "navy" && "text-neutral-500",
                          )}
                        >
                          {plan.subtitle}
                        </p>
                      )}
                    </div>
                    {/* Quantity & CTA */}
                    <QuantitySelector plan={plan} />
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col gap-3">
                    {plan.features.map((feat) => {
                      const tickSrc =
                        plan.variant === "navy"
                          ? "/icons/tick-circle.svg"
                          : "/icons/tick-circle-green.svg";
                      const crossSrc =
                        plan.variant === "navy"
                          ? "/icons/close-circle.svg"
                          : "/icons/close-circle-green.svg";
                      return (
                        <li key={feat.label} className="flex items-center gap-2">
                          <img
                            src={feat.included ? tickSrc : crossSrc}
                            alt=""
                            aria-hidden="true"
                            width={24}
                            height={24}
                            className="shrink-0 self-start"
                          />
                          <span
                            className={cn(
                              "font-open-sans text-base",
                              plan.variant === "navy" ? "text-white" : "text-neutral-900",
                            )}
                          >
                            {feat.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
