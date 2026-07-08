import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomePricingSection } from "@/types/home";
import { cn } from "@/lib/utils/cn";
import { PricingCta } from "./pricing-cta";

interface PricingSectionProps {
  data?: HomePricingSection;
}

export function PricingSection({ data }: PricingSectionProps) {
  if (!data?.plans?.length) return null;

  const { header, plans } = data;

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="font-suse text-[2rem] font-bold text-neutral-900">{header.title}</h2>
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
              {plan.badge === "best-value" && (
                <div className="absolute -top-4 right-6 z-20 flex items-start">
                  <div className="text-secondary-700 relative rounded-b-lg bg-white p-4 text-sm font-medium shadow-md">
                    Best Value
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

              {plan.badge === "most-popular" && (
                <div className="absolute -top-4 right-6 z-20 flex items-start">
                  <div
                    className="relative rounded-b-lg p-4 text-sm font-medium text-neutral-900 shadow-md"
                    style={{ background: "linear-gradient(85deg, #01aee0 0%, #00c7ff 100%)" }}
                  >
                    Most Popular
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
                  "relative flex h-full flex-col gap-6 overflow-hidden rounded-[12px] p-8",
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
                      )}
                    >
                      {plan.subtitle}
                    </p>
                  )}

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

                  <ul className="flex flex-col gap-3">
                    {plan.features.map((feat) => (
                      <li key={feat.label} className="flex items-center gap-2">
                        <img
                          src={feat.included ? "/icons/tick-circle.svg" : "/icons/close-circle.svg"}
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
                    ))}
                  </ul>
                </div>

                <PricingCta
                  plan={plan}
                  className={cn(
                    "font-open-sans mt-auto flex h-10 items-center justify-center rounded-full text-sm font-medium transition-transform hover:scale-105",
                    plan.variant === "default" &&
                      "border-secondary-500 text-secondary-500 border bg-transparent",
                    plan.variant === "beige" &&
                      "border-secondary-500 text-secondary-500 border bg-white",
                    plan.variant === "navy" &&
                      "border-primary-500 border text-base font-bold text-neutral-900",
                  )}
                  style={
                    plan.variant === "navy"
                      ? { background: "linear-gradient(90deg, #00bbf0, #8AE0F8)" }
                      : undefined
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
