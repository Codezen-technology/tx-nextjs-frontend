"use client";

import { useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useCourses } from "@/lib/hooks/useCourses";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CourseCard, CourseCardSkeleton } from "@/components/courses/course-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";

export function CoursesGrid() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search, 350);

  const { data, isLoading, isError, isFetching } = useCourses({
    search: debounced,
    page,
    perPage: 12,
  });

  const totalPages = data?.totalPages ?? 1;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search courses..."
            className="pl-9"
            aria-label="Search courses"
          />
        </div>
        {data?.total ? (
          <p className="text-muted-foreground text-sm">
            {data.total.toLocaleString()} courses
            {isFetching ? " \u2022 updating\u2026" : ""}
          </p>
        ) : null}
      </div>

      {isError ? (
        <EmptyState
          icon={<GraduationCap className="h-10 w-10" />}
          title="Couldn't load courses"
          description="The LMS API is unreachable right now. Verify NEXT_PUBLIC_WP_API_URL and try again."
        />
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="h-10 w-10" />}
          title="No courses found"
          description={debounced ? `No results for "${debounced}".` : "Check back soon."}
        />
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isFetching}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isFetching}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </section>
  );
}
