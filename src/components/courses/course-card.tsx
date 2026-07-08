import { cn } from "@/lib/utils/cn";
import { formatDuration, pluralize } from "@/lib/utils/format";
import type { Course } from "@/types/course";
import { BookOpen, Check, Clock, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface CourseCardProps {
  course: Course;
  className?: string;
  /** Eager-load + high fetchpriority for above-the-fold (LCP) cards */
  priority?: boolean;
}

export function CourseCard({ course, className, priority = false }: CourseCardProps) {
  const badges = course.categories?.slice(0, 3) ?? [];

  return (
    <div
      className={cn(
        "group border-neutral-30 flex flex-col overflow-hidden rounded-lg border bg-white shadow-xs transition-shadow hover:shadow-md",
        className,
      )}
    >
      <Link href={`/course/${course.slug}`} className="block shrink-0">
        <div className="bg-neutral-20 relative aspect-19/10 w-full overflow-hidden">
          {course.featuredImage ? (
            <Image
              src={course.featuredImage}
              alt={course.title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="bg-neutral-20 flex h-full items-center justify-center text-neutral-100">
              <BookOpen className="h-10 w-10" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Rating + bookmark */}
        {/* Hide until bookmark section is implemented */}
        {/* <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>{course.rating?.toFixed(1) ?? "4.5"}</span>
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {course.ratingCount ? (
              <span className="text-neutral-400">({course.ratingCount.toLocaleString()} Reviews)</span>
            ) : null}
          </div>
          <button
            aria-label="Bookmark course"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-30 text-neutral-400 transition-colors hover:bg-neutral-30 hover:text-neutral-600"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div> */}

        {/* Title */}
        <Link href={`/course/${course.slug}`}>
          <h3 className="font-suse hover:text-secondary-500 line-clamp-2 h-12 leading-snug font-bold text-neutral-900 transition-colors">
            {course.title}
          </h3>
        </Link>

        {/* Accreditation badges */}
        {badges.length > 0 && (
          <div className="flex scrollbar-none gap-2 overflow-x-auto py-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {badges.map((cat) => (
              <span
                key={cat.id}
                className="bg-secondary-50 font-open-sans text-secondary-900 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs whitespace-nowrap"
              >
                <Check className="h-2.5 w-2.5 shrink-0" />
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-200">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {course.modules_count ?? 0} {pluralize(course.modules_count ?? 0, "Module")}
          </span>

          {course.durationSeconds ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(course.durationSeconds ?? 0)}
            </span>
          ) : null}
          {course.studentsCount ? (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {course.studentsCount >= 1000
                ? `${(course.studentsCount / 1000).toFixed(0)}k+`
                : course.studentsCount}{" "}
              Students
            </span>
          ) : null}
        </div>

        <div className="border-secondary-100 mt-auto border border-dashed" />

        {/* Price + CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            {course.isFree ? (
              <span className="font-open-sans text-xl font-bold text-neutral-900">Free</span>
            ) : course.price ? (
              <>
                <span className="font-open-sans font-bold text-neutral-900">
                  <span className="text-xl">£{course.price}</span>
                  <span className="text-xs font-normal"> +VAT</span>
                </span>
                {course.originalPrice && course.originalPrice > course.price ? (
                  <span className="font-open-sans text-sm text-[#dc3545] line-through">
                    £{course.originalPrice}
                  </span>
                ) : null}
              </>
            ) : null}
          </div>
          <Link
            href={`/course/${course.slug}`}
            className="border-secondary-500 text-secondary-500 hover:bg-secondary-50 group-hover:border-primary-600 group-hover:bg-primary-500 inline-flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm transition-colors group-hover:text-white"
          >
            View Course →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="border-neutral-30 flex flex-col overflow-hidden rounded-lg border bg-white">
      <div className="bg-neutral-20 aspect-19/10 w-full animate-pulse" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div className="bg-neutral-20 h-4 w-24 animate-pulse rounded" />
          <div className="bg-neutral-20 h-8 w-8 animate-pulse rounded-full" />
        </div>
        <div className="bg-neutral-20 h-5 w-full animate-pulse rounded" />
        <div className="bg-neutral-20 h-4 w-3/4 animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="bg-neutral-20 h-5 w-12 animate-pulse rounded-full" />
          <div className="bg-neutral-20 h-5 w-14 animate-pulse rounded-full" />
        </div>
        <div className="mt-2 flex gap-4">
          <div className="bg-neutral-20 h-3 w-20 animate-pulse rounded" />
          <div className="bg-neutral-20 h-3 w-16 animate-pulse rounded" />
        </div>
        <div className="border-neutral-30 border-t pt-3">
          <div className="flex items-center justify-between">
            <div className="bg-neutral-20 h-6 w-20 animate-pulse rounded" />
            <div className="bg-neutral-20 h-8 w-28 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
