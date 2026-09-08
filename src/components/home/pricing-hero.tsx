import { HeroWave, HERO_GRADIENT } from "@/components/courses/hero-wave";

interface PricingHeroProps {
  description?: string;
}

export function PricingHero({
  description = "Our pricing plans are designed to be clear and flexible, giving you access to high-quality, accredited training that supports your personal, professional, and business goals.",
}: PricingHeroProps) {
  // Inset measured at 112/112 on the frame's hero band (6239:135726 — band
  // 320, title at y=112 h=96). The inset is the target, not the height: the
  // band grows with a wrapping title instead of eating its own padding.
  // QA-PRICE-A1. The frame's wave and pattern are Class D, filed alongside
  // QA-BLOG-D2 and QA-COURSES-D2.
  return (
    <section className="relative w-full overflow-hidden" style={{ background: HERO_GRADIENT }}>
      <HeroWave />
      <div className="relative container flex flex-col items-start gap-4 py-[112px] md:flex-row md:items-center md:gap-[179px]">
        <h1 className="font-suse shrink-0 text-[40px] leading-[1.2] text-white">
          <span className="block font-light">Our</span>
          <span className="block font-bold">Pricing Plans</span>
        </h1>
        <p className="font-open-sans text-neutral-30 max-w-[856px] text-[20px] leading-normal font-light">
          {description}
        </p>
      </div>
    </section>
  );
}
