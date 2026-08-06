import { HeroWave, HERO_GRADIENT } from "@/components/courses/hero-wave";
import type { ApiCategory } from "@/lib/api/server";

interface CategoryHeroProps {
  category: ApiCategory;
}

export function CategoryHero({ category }: CategoryHeroProps) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 350 }}>
      <div className="absolute inset-0" style={{ background: HERO_GRADIENT }} />
      <HeroWave />

      <div className="relative z-10 flex h-full flex-col justify-center">
        <div className="mx-auto w-full max-w-[1296px] px-4">
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
