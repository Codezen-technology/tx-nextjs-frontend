import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HeroCarousel } from "./hero-carousel";
import { CourseCard } from "@/components/courses/course-card";
import { SafeImage } from "@/components/ui/safe-image";
import { coursesService } from "@/lib/services/courses";
import { publicImageExists } from "@/lib/utils/public-image.server";
import type { Course } from "@/types/course";

const HERO_ACCREDITATIONS = [
  { src: "/images/cpd-logo.png", alt: "CPD Certified", width: 56, height: 56, label: "CPD Certified" },
  {
    src: "/images/ukrlp-logo.png",
    alt: "UKRLP Registered",
    width: 75,
    height: 20,
    label: "UKRLP Registered",
  },
] as const;

const POPULAR_CATEGORIES = [
  "Discount courses",
  "Online courses",
  "On Demand courses",
  "Accounting courses",
  "IT courses",
];

async function getPopularCourses(): Promise<Course[]> {
  try {
    const res = await coursesService.list({ perPage: 4, orderBy: "popularity", order: "desc" });
    return res.items;
  } catch {
    return [];
  }
}

export async function HeroSection() {
  const courses = await getPopularCourses();

  return (
    <section className="relative overflow-x-clip bg-[#e6f8fe]">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-12 px-6 py-[60px] lg:flex-row lg:items-center lg:px-10 lg:py-[160px]">
        <div className="flex w-full min-w-0 flex-col gap-6 lg:max-w-[636px]">
          <div className="flex flex-col gap-4">
            <h1 className="font-suse text-[40px] font-bold leading-[1.2] text-[#00204a] md:text-[48px] lg:text-[56px]">
              UK&apos;s Leading eLearning Hub for Growth
            </h1>
            <p className="font-open-sans text-base font-normal leading-[1.5] text-[#3b5374]">
              Join thousands of professionals and businesses across the UK. Be industry-ready with
              expert-led, accredited online training and earn recognised certifications. Stay
              compliant, upskill, and advance with quality courses, anywhere, anytime.
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
            <form action="/courses" method="get" className="flex items-center gap-6 p-6">
              <input
                name="search"
                type="text"
                placeholder="Subject or qualification, e.g. IT Course"
                className="h-[56px] flex-1 rounded-[2px] px-8 font-open-sans text-sm text-[#767476] outline-none placeholder:text-[#767476]"
              />
              <button
                type="submit"
                className="shrink-0 rounded-[2px] bg-[#9e6f21] px-[25px] py-4 font-open-sans text-base font-normal leading-[1.5] text-white transition-opacity hover:opacity-90"
              >
                Search Courses
              </button>
            </form>

            <div className="flex items-center gap-2 overflow-hidden px-6 pb-6">
              <ChevronLeft className="h-4 w-4 shrink-0 text-white" />
              <div className="flex min-w-0 flex-1 items-center overflow-x-auto">
                {POPULAR_CATEGORIES.map((cat, i) => (
                  <span key={cat} className="flex shrink-0 items-center">
                    <Link
                      href={`/courses?search=${encodeURIComponent(cat)}`}
                      className="whitespace-nowrap px-2 font-open-sans text-base font-normal leading-[1.5] text-white/90 transition-colors hover:text-white"
                    >
                      {cat}
                    </Link>
                    {i < POPULAR_CATEGORIES.length - 1 && (
                      <span className="text-white/40">|</span>
                    )}
                  </span>
                ))}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-white" />
            </div>
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
