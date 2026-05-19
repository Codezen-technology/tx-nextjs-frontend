import { SafeImage } from "@/components/ui/safe-image";
import { isRenderableImageSrc } from "@/lib/utils/image";
import Link from "next/link";
import { Clock, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CourseRichData } from "@/types/course";

const BADGE_MAP: Record<string, { label: string; className: string }> = {
  bestseller: { label: "Bestseller", className: "bg-green-500 text-white" },
  limited_time_offer: { label: "Limited Time Offer", className: "bg-red-500 text-white" },
};

interface CourseHeroProps {
  course: CourseRichData;
}

export function CourseHero({ course }: CourseHeroProps) {
  const durationLabel = course.duration
    ? `${(course.duration as { value: number; unit: string }).value} ${(course.duration as { value: number; unit: string }).unit}`
    : null;

  return (
    <section className="relative min-h-[420px] bg-neutral-900 text-white">
      {isRenderableImageSrc(course.featuredImage) ? (
        <>
          <SafeImage
            src={course.featuredImage}
            alt={course.title}
            fill
            sizes="100vw"
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/90 via-neutral-900/70 to-neutral-900/40" />
        </>
      ) : null}

      <div className="relative container flex flex-col justify-end py-12 lg:py-16" style={{ minHeight: 420 }}>
        {/* Breadcrumb */}
        {course.breadcrumb?.length ? (
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-neutral-300">
            <Link href="/courses" className="hover:text-white transition-colors">
              Courses
            </Link>
            {course.breadcrumb.map((crumb) => (
              <span key={crumb.id} className="flex items-center gap-1.5">
                <span>/</span>
                <Link href={`/courses?category=${crumb.slug}`} className="hover:text-white transition-colors">
                  {crumb.name}
                </Link>
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span>/</span>
              <span className="text-white">{course.title}</span>
            </span>
          </nav>
        ) : null}

        {/* Badges */}
        {course.badges?.length ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {course.badges.map((b) => {
              const cfg = BADGE_MAP[b];
              return cfg ? (
                <span key={b} className={cn("rounded px-2.5 py-1 text-xs font-semibold", cfg.className)}>
                  {cfg.label}
                </span>
              ) : null;
            })}
          </div>
        ) : null}

        {/* Title */}
        <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          {course.title}
        </h1>

        {/* Excerpt */}
        {course.excerpt ? (
          <p className="mt-4 max-w-2xl text-lg text-neutral-200 leading-relaxed">
            {course.excerpt}
          </p>
        ) : null}

        {/* Meta row */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-200">
          {course.rating !== undefined ? (
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-amber-400">{course.rating.toFixed(1)}</span>
              {course.ratingCount ? (
                <span className="text-neutral-300">({course.ratingCount.toLocaleString()} ratings)</span>
              ) : null}
            </span>
          ) : null}
          {course.studentsCount ? (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {course.studentsCount.toLocaleString()} students
            </span>
          ) : null}
          {durationLabel ? (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {durationLabel}
            </span>
          ) : null}
          {course.cpd_points ? (
            <span className="flex items-center gap-1.5 rounded-full border border-neutral-400 px-3 py-0.5 text-xs font-medium">
              CPD: {course.cpd_points} points
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
