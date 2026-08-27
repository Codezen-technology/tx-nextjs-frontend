import { CourseCardSkeleton } from "@/components/courses/course-card";

export default function CourseCategoryLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div
        className="relative w-full animate-pulse overflow-hidden"
        style={{
          height: 480,
          background: "linear-gradient(80.83deg, #00204a 0%, #004f65 100%)",
        }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 flex h-full flex-col justify-center">
          <div className="container">
            {/* Breadcrumb */}
            <div className="mb-6 flex items-center gap-2">
              <div className="h-3.5 w-12 rounded bg-white/20" />
              <div className="h-3.5 w-3.5 rounded bg-white/20" />
              <div className="h-3.5 w-16 rounded bg-white/20" />
              <div className="h-3.5 w-3.5 rounded bg-white/20" />
              <div className="h-3.5 w-24 rounded bg-white/20" />
            </div>
            {/* Title */}
            <div className="max-w-[775px] space-y-4">
              <div className="h-12 w-72 rounded bg-white/20" />
              <div className="h-5 w-[480px] rounded bg-white/20" />
              <div className="h-5 w-96 rounded bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Course grid skeleton */}
      <div className="bg-white">
        <div className="container py-12">
          {/* Section header */}
          <div className="mb-8 space-y-3">
            <div className="h-8 w-64 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-96 animate-pulse rounded bg-neutral-100" />
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
