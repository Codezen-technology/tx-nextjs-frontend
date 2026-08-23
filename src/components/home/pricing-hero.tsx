import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface PricingHeroProps {
  title?: string;
  description?: string;
}

export function PricingHero({
  title = "Our Pricing Plans",
  description = "Our pricing plans are designed to be clear and flexible, giving you access to high-quality, accredited training that supports your personal, professional, and business goals.",
}: PricingHeroProps) {
  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="border-neutral-30 font-open-sans border-b bg-white py-2.5 text-sm text-neutral-500"
      >
        <ol className="container mx-auto flex max-w-[1296px] flex-wrap items-center gap-1.5">
          <li>
            <Link
              href="/"
              className="hover:text-primary-600 flex items-center gap-1 transition-colors"
            >
              <Home className="h-3.5 w-3.5" aria-hidden />
              Home
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden />
            <span className="font-medium text-neutral-900">Pricing</span>
          </li>
        </ol>
      </nav>

      {/* Inset measured at 112/112 on the frame's hero band (6239:135726 — band
          320, title at y=112 h=96). The inset is the target, not the height: the
          band grows with a wrapping title instead of eating its own padding.
          QA-PRICE-A1. The frame's wave and pattern are Class D, filed alongside
          QA-BLOG-D2 and QA-COURSES-D2. */}
      <section className="bg-secondary-50 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[url('/images/plus-shape.png')] bg-contain bg-right bg-no-repeat opacity-40"
          aria-hidden="true"
        />
        <div className="relative container mx-auto flex flex-col gap-6 py-16 md:flex-row md:items-center md:justify-between md:gap-12 lg:py-[112px]">
          <h1 className="font-suse shrink-0 text-[2.5rem] leading-[1.2] font-bold text-neutral-900">
            {title}
          </h1>
          <p className="font-open-sans max-w-[856px] text-base leading-[1.6] text-neutral-600">
            {description}
          </p>
        </div>
      </section>
    </>
  );
}
