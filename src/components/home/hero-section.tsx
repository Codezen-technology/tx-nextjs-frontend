import { HeroCarousel } from "./hero-carousel";
import { CategoriesScroller } from "./categories-scroller";
import { CourseCard } from "@/components/courses/course-card";
import { SafeImage } from "@/components/ui/safe-image";
import { coursesService } from "@/lib/services/courses";
import { publicImageExists } from "@/lib/utils/public-image.server";
import type { Course, CourseCategory } from "@/types/course";
import heroData from "@/data/home/hero.json";

const overlayImage = "/images/Overlay-Image.webp";
const HERO_ACCREDITATIONS = heroData.accreditations;

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

export async function HeroSection() {
  const [courses, categories] = await Promise.all([getPopularCourses(), getCategories()]);

  return (
    <section
      className="relative overflow-x-clip bg-primary-50 bg-cover bg-center"
      style={{ backgroundImage: `url(${overlayImage})` }}
    >
      <div className="mx-auto flex max-w-none flex-col items-start gap-12 px-4 py-[60px] lg:max-w-[1400px] lg:items-center lg:py-[170px] xl:flex-row xl:px-0">
        <div className="flex w-full min-w-0 flex-col gap-6 lg:max-w-[636px]">
          <div className="flex flex-col gap-4">
            <h1 className="font-suse text-[40px] font-bold leading-[1.2] text-neutral-900 md:text-[48px] lg:text-[56px]">
              {heroData.title}
            </h1>
            <p className="font-open-sans text-base font-normal leading-[1.5] text-neutral-500">
              {heroData.description}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {HERO_ACCREDITATIONS.map((badge) => (
              <div
                key={badge.src}
                className="flex h-[80px] w-[100px] items-center justify-center overflow-hidden rounded-[8px] border border-[#eaecee] bg-white px-2"
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
                  <span className="text-center font-open-sans text-[11px] font-semibold leading-tight text-[#00204a]">
                    {badge.label}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-[4px] bg-[rgba(0,32,74,0.4)] backdrop-blur-[8px]">
            <form
              action="/search"
              method="get"
              className="flex flex-col items-center gap-6 p-6 md:flex-row"
            >
              <input
                name="q"
                type="text"
                placeholder="Subject or qualification, e.g. IT Course"
                className="h-[56px] flex-1 rounded-[2px] bg-white px-8 font-open-sans text-sm text-[#767476] outline-none placeholder:text-[#767476]"
              />
              <button
                type="submit"
                className="shrink-0 rounded-[2px] bg-[#9e6f21] px-[25px] py-4 font-open-sans text-base font-normal leading-[1.5] text-white transition-opacity hover:opacity-90"
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
              <CourseCard course={courses[0]} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
