"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { coursesService } from "@/lib/services/courses";
import { queryKeys } from "@/lib/utils/query-keys";
import { CourseCard, CourseCardSkeleton } from "@/components/courses/course-card";
import type { PopularCoursesBlock as PopularCoursesBlockData } from "@/types/page";
import { ArrowRight } from "lucide-react";

export function PopularCoursesBlock({ block }: { block: PopularCoursesBlockData }) {
  const limit = block.limit || 8;
  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.courses.all, "popular", limit],
    queryFn: () => coursesService.popular(limit),
  });

  const courses = data?.items ?? [];

  return (
    <section className="py-12">
      <div className="container">
        {(block.title || block.description) && (
          <div className="mb-8 max-w-2xl">
            {block.title && (
              <h2 className="font-suse text-2xl font-bold text-neutral-900 md:text-3xl">
                {block.title}
              </h2>
            )}
            {block.description && (
              <p className="font-open-sans mt-3 text-neutral-200">{block.description}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <CourseCardSkeleton key={i} />)
            : courses.map((course) => <CourseCard key={course.id} course={course} />)}
        </div>

        {block.cta?.href && (
          <div className="mt-8 text-center">
            <Link
              href={block.cta.href}
              className="bg-primary-500 font-open-sans hover:bg-primary-600 inline-flex items-center gap-1 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {block.cta.label || "View all courses"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
