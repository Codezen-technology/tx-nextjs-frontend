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
        className="border-b border-neutral-30 bg-white py-2.5 font-open-sans text-sm text-neutral-500"
      >
        <ol className="container mx-auto flex max-w-[1296px] flex-wrap items-center gap-1.5">
          <li>
            <Link
              href="/"
              className="flex items-center gap-1 transition-colors hover:text-primary-600"
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

      <section className="relative overflow-hidden bg-[#f5f1e9]">
        <div
          className="pointer-events-none absolute inset-0 bg-[url('/images/plus-shape.png')] bg-contain bg-right bg-no-repeat opacity-40"
          aria-hidden="true"
        />
        <div className="container relative mx-auto flex flex-col gap-6 py-16 md:flex-row md:items-center md:justify-between md:gap-12">
          <h1 className="shrink-0 font-suse text-[2.5rem] font-bold leading-[1.2] text-neutral-900">
            {title}
          </h1>
          <p className="max-w-[856px] font-open-sans text-base leading-[1.6] text-neutral-600">
            {description}
          </p>
        </div>
      </section>
    </>
  );
}
