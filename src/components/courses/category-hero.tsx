import { HeroWave, HERO_GRADIENT } from "@/components/courses/hero-wave";
import type { ApiCategory } from "@/lib/api/server";

interface CategoryHeroProps {
  category: ApiCategory;
}

/**
 * `min-h` keeps the band's current height for short content; the 2xl inset is the
 * measured one — node `3294:42433` is a 480 band around content ending at 374, so
 * 106. Padding rather than a fixed height, because the frame sizes the band from
 * its content: a fixed height silently shrinks the inset as the title wraps, which
 * is the defect `QA-CAT-A2` describes.
 *
 * The inner wrapper is `container` so the hero shares the page column. It rolled
 * its own `max-w-[1296px] px-4`, which put its content 112px inside the header's
 * at 1280 — `QA-CAT-A1`.
 */
export function CategoryHero({ category }: CategoryHeroProps) {
  return (
    <div className="relative flex min-h-[350px] w-full flex-col justify-center overflow-hidden 2xl:py-[106px]">
      <div className="absolute inset-0" style={{ background: HERO_GRADIENT }} />
      <HeroWave />

      <div className="relative z-10">
        <div className="container">
          <div className="max-w-[775px]">
            <h1 className="font-suse text-[48px] leading-[1.2] font-bold text-white">
              {category.name}
            </h1>
            {category.description ? (
              <p className="font-open-sans mt-6 max-w-[856px] text-[18px] leading-[1.6] text-white/90">
                {category.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
