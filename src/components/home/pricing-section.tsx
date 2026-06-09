import Link from "next/link";
import { ArrowRight } from "lucide-react";
import pricingData from "@/data/home/pricing.json";
import { cn } from "@/lib/utils/cn";

export function PricingSection() {
  const { header, plans } = pricingData;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-suse text-[2rem] font-bold text-neutral-900">
              {header.title}
            </h2>
            <p className="font-open-sans text-neutral-500 text-base">
              {header.description}
            </p>
          </div>
          <Link
            href={header.ctaHref}
            className="inline-flex shrink-0 items-center gap-2 font-open-sans text-base font-medium text-secondary-500 transition-colors hover:text-secondary-600"
          >
            {header.ctaLabel}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className="relative">
              {/* Ribbon Badge */}
              {plan.badge === "best-value" && (
                <div className="absolute -top-4 right-6 z-20 flex items-start">
                  <div className="relative bg-white text-secondary-700 font-medium text-sm shadow-md p-4 rounded-b-lg">
                    Best Value
                    <svg
                      className="absolute top-0 -right-[0.75rem]"
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
                    className="relative text-neutral-900 font-medium text-sm shadow-md p-4 rounded-b-lg"
                    style={{ background: "linear-gradient(85deg, #01aee0 0%, #00c7ff 100%)" }}
                  >
                    Most Popular
                    <svg
                      className="absolute top-0 -right-[0.75rem]"
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

              {/* Card */}
              <div
                className={cn(
                  "relative flex flex-col gap-6 overflow-hidden rounded-[12px] p-8 h-full",
                  plan.variant === "default" && "border border-[#ebedf1] bg-white shadow-sm",
                  plan.variant === "beige" && "border border-[#ebedf1] shadow-sm",
                  plan.variant === "navy" && "border-transparent shadow-lg"
                )}
                style={
                  plan.variant === "beige"
                    ? { background: "linear-gradient(210.15deg, #f5f1e9 14.85%, #e1d2ba 96.39%)" }
                    : plan.variant === "navy"
                    ? { background: "linear-gradient(30.18deg, #00204a 9.18%, #1c395e 92.41%)" }
                    : undefined
                }
              >
                {/* Navy pattern */}
                {plan.variant === "navy" && (
                  <div
                    className="pointer-events-none absolute inset-0 bg-[url('/images/plus-shape.png')] bg-no-repeat bg-contain bg-right"
                    aria-hidden="true"
                  />
                )}

                {/* Plan content */}
                <div className="flex flex-col gap-4">
                  <p
                    className={cn(
                      "font-suse text-xl font-bold",
                      plan.variant === "default" && "text-neutral-900",
                      plan.variant === "beige" && "text-secondary-500",
                      plan.variant === "navy" && "text-[#00bbf0]"
                    )}
                  >
                    {plan.name}
                  </p>

                  {plan.subtitle && (
                    <p
                      className={cn(
                        "font-open-sans text-base",
                        plan.variant === "navy" && "text-white"
                      )}
                    >
                      {plan.subtitle}
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    {plan.originalPrice && (
                      <span className="text-[#dc3545] line-through font-bold text-xl">
                        {plan.originalPrice}
                      </span>
                    )}
                    <span
                      className={cn(
                        "font-suse font-bold",
                        plan.variant === "navy" ? "text-white" : "text-neutral-900"
                      )}
                    >
                      <span className="text-2xl">{plan.price}</span>
                      {plan.priceUnit && <span className="text-base">{plan.priceUnit}</span>}
                    </span>
                  </div>

                  {/* Features */}
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
                            plan.variant === "navy" ? "text-white" : "text-neutral-900"
                          )}
                        >
                          {feat.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Link
                  href={plan.ctaHref}
                  className={cn(
                    "mt-auto flex h-10 items-center justify-center rounded-full font-open-sans text-sm font-medium transition-transform hover:scale-105",
                    plan.variant === "default" &&
                      "border border-secondary-500 bg-transparent text-secondary-500",
                    plan.variant === "beige" &&
                      "border border-secondary-500 bg-white text-secondary-500",
                    plan.variant === "navy" &&
                      "border border-[#00bbf0] text-neutral-900 font-bold text-base"
                  )}
                  style={
                    plan.variant === "navy"
                      ? { background: "linear-gradient(90deg, #00bbf0, #8AE0F8)" }
                      : undefined
                  }
                >
                  {plan.ctaLabel}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}