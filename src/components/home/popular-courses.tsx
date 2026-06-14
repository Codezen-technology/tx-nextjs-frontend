import Link from "next/link";
import { serverApi } from "@/lib/api/server";
import { normalizeCourse } from "@/lib/services/courses";
import { CourseCard } from "@/components/courses/course-card";
import { ChevronRight } from "lucide-react";
import type { HomePopularCoursesHeader } from "@/types/home";

interface PopularCoursesProps {
  limit?: number;
  header?: HomePopularCoursesHeader;
}

export async function PopularCourses({ limit = 8, header }: PopularCoursesProps) {
  if (!header) return null;

  let data: Awaited<ReturnType<typeof serverApi.courses.popular>> | null = null;

  try {
    data = await serverApi.courses.popular(limit);
  } catch {
    return null;
  }

  if (!data?.items?.length) return null;

  const courses = data.items.map((raw) =>
    normalizeCourse(raw as Parameters<typeof normalizeCourse>[0]),
  );

  return (
    <section>
      <div className="container">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-suse text-3xl font-bold text-neutral-900 md:text-[2rem]">
              {header.title}
            </h2>
            <p className="mt-2 max-w-[760px] font-open-sans text-sm text-neutral-500 md:text-base">
              {header.description}
            </p>
          </div>

          <Link
            href={header.ctaHref}
            className="self-justify-start flex items-center gap-1 font-open-sans text-base font-normal text-secondary-500 transition-colors hover:text-secondary-600"
          >
            {header.ctaLabel}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}
