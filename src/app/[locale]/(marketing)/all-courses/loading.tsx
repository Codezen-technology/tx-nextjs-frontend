import { CourseCardSkeleton } from "@/components/courses/course-card";

export default function AllCoursesLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div
        className="relative w-full animate-pulse"
        style={{ background: "linear-gradient(80.83deg,#00204a 0%,#004f65 100%)", minHeight: 320 }}
      >
        <div className="mx-auto flex max-w-[1296px] items-center gap-[179px] px-4 py-[112px]">
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
        <div className="mx-auto max-w-[1296px] px-4 py-12">
          <div className="flex items-start gap-6">
            {/* Filter sidebar skeleton */}
            <aside className="border-neutral-30 w-[306px] shrink-0 space-y-3 rounded-xl border p-5">
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
