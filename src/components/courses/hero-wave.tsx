import Image from "next/image";

/**
 * Decorative wave that sits along the bottom edge of the navy hero gradient.
 * Shared by the all-courses, course-category and certificate heroes.
 */
export function HeroWave() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden opacity-10 sm:h-20">
      <div className="absolute top-0 left-1/2 flex h-[405.89px] w-[max(100%,1920px)] -translate-x-1/2 items-center justify-center">
        <div className="shrink-0 -rotate-90">
          <Image
            src="/images/course-banner-wave.svg"
            alt=""
            width={406}
            height={1920}
            decoding="async"
            className="block h-[1920px] w-[405.89px] max-w-none"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

/** Figma: navy → teal hero gradient used across the course marketing heroes. */
export const HERO_GRADIENT = "linear-gradient(88deg, rgb(0, 32, 74) 0%, rgb(0, 79, 101) 100.15%)";
