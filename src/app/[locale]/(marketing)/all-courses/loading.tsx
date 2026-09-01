import { CourseCardSkeleton } from "@/components/courses/course-card";

/**
 * The breakpoints mirror `all-courses-hero.tsx` and `all-courses-client.tsx`.
 * A skeleton that keeps the desktop rail shows the 660px-wide document at 440
 * that `QA-COURSES-D1` is about, for as long as the page is streaming.
 */
export default function AllCoursesLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div
        className="relative w-full animate-pulse"
        style={{ background: "linear-gradient(80.83deg,#00204a 0%,#004f65 100%)", minHeight: 320 }}
      >
        <div className="container flex flex-col gap-6 py-12 lg:flex-row lg:items-center lg:gap-[179px] lg:py-[112px]">
          <div className="shrink-0 space-y-3">
            <div className="h-10 w-32 rounded bg-white/20" />
            <div className="h-10 w-48 rounded bg-white/20" />
          </div>
          <div className="max-w-[856px] space-y-3">
            <div className="h-5 w-full rounded bg-white/20" />
            <div className="h-5 w-4/5 rounded bg-white/20" />
          </div>
        </div>
      </div>

      {/* Content skeleton — sidebar + course sections */}
      <div className="bg-white">
        <div className="container py-12">
          <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-start">
            {/* Filter sidebar skeleton */}
            <aside className="border-neutral-30 w-full space-y-3 rounded-xl border p-5 lg:w-[306px] lg:shrink-0">
              <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-pulse rounded bg-neutral-200" />
                  <div
                    className="h-4 animate-pulse rounded bg-neutral-100"
                    style={{ width: `${60 + (i % 3) * 20}px` }}
                  />
                </div>
              ))}
            </aside>

            {/* Course sections skeleton */}
            <div className="flex min-w-0 flex-1 flex-col gap-16">
              {Array.from({ length: 3 }).map((_, s) => (
                <div key={s}>
                  <div className="mb-6 flex items-end justify-between">
                    <div className="h-7 w-48 animate-pulse rounded bg-neutral-200" />
                    <div className="h-4 w-20 animate-pulse rounded bg-neutral-100" />
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <CourseCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
