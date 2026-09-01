import { HeroWave, HERO_GRADIENT } from "@/components/courses/hero-wave";

/**
 * The desktop values used to carry no breakpoint, which put a 179px gap and a
 * 112px inset inside a 440 viewport — `QA-COURSES-D1`. Written mobile-first so a
 * value with no breakpoint means the small screen, not every screen.
 *
 * The 1920 inset (112, node `3306:50115`) and the 1280 page-grid edge are pinned
 * by `e2e/design-fidelity.spec.ts`; `lg` rather than `2xl` because 1280 renders
 * the 112 today and the report signs that width off as working. The mobile
 * values are decisions, not measurements — no 440 frame exists for this page.
 */
export function AllCoursesHero() {
  return (
    <div
      className="relative w-full"
      style={{
        background: HERO_GRADIENT,
        minHeight: 320,
      }}
    >
      <HeroWave />
      <div className="container flex flex-col gap-6 py-12 lg:flex-row lg:items-center lg:gap-[179px] lg:py-[112px]">
        {/* The catalogue landing page's H1. Rendered as two lines to match the
            Figma treatment without splitting the heading into two elements. */}
        <h1 className="font-suse shrink-0 text-[32px] leading-[1.2] text-white lg:text-[40px]">
          <span className="block font-light">Explore</span>
          <span className="block font-bold">Our Courses</span>
        </h1>
        <p className="font-open-sans text-neutral-30 max-w-[856px] text-base leading-normal font-light lg:text-[20px]">
          The range of courses we offer is versatile, aiming to provide you with the best experience
          that will help you meet your personal, professional, and business goals.
        </p>
      </div>
    </div>
  );
}
