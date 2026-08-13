import { HeroCarousel } from "./hero-carousel";
import { CategoriesScroller } from "./categories-scroller";
import { CourseCard } from "@/components/courses/course-card";
import { SafeImage } from "@/components/ui/safe-image";
import { coursesService } from "@/lib/services/courses";
import { publicImageExists } from "@/lib/utils/public-image.server";
import type { Course, CourseCategory } from "@/types/course";
import type { HomeHeroHeadline } from "@/types/home";

const overlayImage = "/images/Overlay-Image.webp";

interface HeroSectionProps {
  headline?: HomeHeroHeadline;
}

async function getPopularCourses(): Promise<Course[]> {
  try {
    const res = await coursesService.list({ perPage: 4, orderBy: "popularity", order: "desc" });
    return res.items;
  } catch {
    return [];
  }
}

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
      <div className="mx-auto flex max-w-none flex-col items-start gap-12 px-4 py-15 lg:max-w-350 lg:items-center lg:py-[133px] xl:flex-row xl:px-0">
        <div className="flex w-full min-w-0 flex-col gap-6 lg:max-w-159">
          <div className="flex flex-col gap-4">
            <h1 className="font-suse text-[40px] leading-[1.2] font-bold text-neutral-900 md:text-[48px] lg:text-[56px]">
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
              className="flex flex-col items-center gap-6 p-6 md:flex-row"
            >
              <input
                name="q"
                type="text"
                placeholder="Subject or qualification, e.g. IT Course"
                className="font-open-sans h-14 flex-1 rounded-[2px] bg-white px-8 text-sm text-[#767476] outline-hidden placeholder:text-[#767476]"
              />
              <button
                type="submit"
                className="bg-secondary-600 font-open-sans shrink-0 rounded-[2px] px-6.25 py-4 text-base leading-normal font-normal text-white transition-opacity hover:opacity-90"
              >
                Search Courses
              </button>
            </form>

            <CategoriesScroller categories={categories} />
          </div>
        </div>

        {courses.length > 0 && (
          <>
            <HeroCarousel courses={courses} />
            <div className="w-full lg:hidden">
              <CourseCard course={courses[0]} priority />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
