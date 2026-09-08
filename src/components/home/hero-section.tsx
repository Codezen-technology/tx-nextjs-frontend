import { HeroCarousel } from "./hero-carousel";
import { CategoriesScroller } from "./categories-scroller";
import { CourseCard } from "@/components/courses/course-card";
import { SafeImage } from "@/components/ui/safe-image";
import { serverApi } from "@/lib/api/server";
import { coursesService, normalizeCourseList } from "@/lib/services/courses";
import { publicImageExists } from "@/lib/utils/public-image.server";
import type { Course, CourseCategory } from "@/types/course";
import type { HomeHeroHeadline } from "@/types/home";

const overlayImage = "/images/Overlay-Image.webp";

interface HeroSectionProps {
  headline?: HomeHeroHeadline;
}

/**
 * Reads the hero's courses through the cached server fetcher rather than the browser Axios
 * singleton, so the request lands in the Next data cache under the `courses:popular` tag
 * (`revalidate: 300`) and can be purged on demand via `POST /api/revalidate`.
 *
 * A failure still degrades to an empty list, deliberately. `/[locale]` renders dynamically
 * (confirmed `ƒ` in the build manifest, not `●`), so there is no previously generated page
 * for Next.js to fall back on — throwing here would replace a hero missing its carousel
 * with a 500 for the whole homepage. Degrading also keeps the invariant `fetch-timeout.ts`
 * relies on: every server-side caller survives a thrown fetch, so a stalled WordPress
 * request costs one section rather than the page. Next does not cache a failed fetch, so
 * the next request retries immediately rather than serving an empty list for 300s.
 */
async function getPopularCourses(): Promise<Course[]> {
  try {
    const data = await serverApi.courses.popular(4);
    return normalizeCourseList(data.items ?? []);
  } catch {
    return [];
  }
}

// Still on the Axios path — categories are decorative here, so a failure degrades to an
// empty scroller rather than failing the render.
async function getCategories(): Promise<CourseCategory[]> {
  try {
    return await coursesService.categories();
  } catch {
    return [];
  }
}

export async function HeroSection({ headline }: HeroSectionProps) {
  if (!headline?.title) return null;

  const [courses, categories] = await Promise.all([getPopularCourses(), getCategories()]);
  const accreditations = headline.accreditations ?? [];

  return (
    <section
      className="bg-primary-50 relative overflow-x-clip bg-cover bg-center"
      style={{ backgroundImage: `url(${overlayImage})` }}
    >
      {/* lg:py-[133px] is measured, not chosen: Figma's hero band (`6056:20231`)
          is 844 tall around a 577-tall visual column, leaving a 133/134 inset.
          The QA report's "80–100px" matches neither the frame nor the build. */}
      {/* `items-center` only means anything once this is a row, so it switches at xl with
          flex-direction — at lg it was a no-op that also let the carousel size itself to
          its own nav row. */}
      <div
        data-testid="hero-row"
        className="mx-auto flex max-w-none flex-col items-start gap-12 px-4 py-15 lg:max-w-350 lg:py-20 xl:flex-row xl:items-center xl:px-0"
      >
        <div className="flex w-full min-w-0 flex-col gap-6 lg:max-w-159">
          <div className="flex flex-col gap-4">
            <h1 className="font-suse text-[32px] leading-[1.2] font-bold text-neutral-900 md:text-[40px] lg:text-[56px]">
              {headline.title}
            </h1>
            {headline.description && (
              <p className="font-open-sans text-base leading-normal font-normal text-neutral-500">
                {headline.description}
              </p>
            )}
          </div>

          {accreditations.length > 0 && (
            <div className="flex items-center gap-4">
              {accreditations.map((badge) => (
                <div
                  key={badge.src}
                  className="flex h-20 w-25 items-center justify-center overflow-hidden rounded-[8px] border border-[#eaecee] bg-white px-2"
                >
                  {publicImageExists(badge.src) ? (
                    <SafeImage
                      src={badge.src}
                      alt={badge.alt}
                      width={badge.width}
                      height={badge.height}
                      className="object-contain"
                    />
                  ) : (
                    <span className="font-open-sans text-center text-[11px] leading-tight font-semibold text-neutral-900">
                      {badge.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-lg bg-[rgba(0,32,74,0.4)] backdrop-blur-sm">
            <form
              action="/search"
              method="get"
              className="flex flex-col items-center gap-4 p-6 md:flex-row lg:gap-6"
            >
              <input
                name="q"
                type="text"
                placeholder="Subject or qualification, e.g. IT Course"
                className="font-open-sans w-full flex-1 rounded-[2px] bg-white px-4 py-3 text-sm text-[#767476] outline-hidden placeholder:text-[#767476] md:py-3.5"
              />
              <button
                type="submit"
                className="bg-secondary-600 font-open-sans w-full shrink-0 rounded-[2px] px-6.25 py-1.75 text-base leading-normal font-normal text-white transition-opacity hover:opacity-90 md:w-fit md:py-3"
              >
                Search Courses
              </button>
            </form>

            <CategoriesScroller categories={categories} />
          </div>
        </div>

        {courses.length > 0 && (
          <>
            {/* Carousel and fallback switch on the same breakpoint as the hero row (xl), so
                exactly one course presentation renders at any width. Below xl the three-card
                stack has too little room beside the headline column to stay legible. */}
            <HeroCarousel courses={courses} />
            <div data-testid="hero-fallback-card" className="w-full xl:hidden">
              <CourseCard course={courses[0]} priority />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
