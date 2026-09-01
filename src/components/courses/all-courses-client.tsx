"use client";

import { useState, useRef, useEffect } from "react";
import { CourseCategoryFilter } from "@/components/courses/course-category-filter";
import { CoursesByCategorySection } from "@/components/courses/courses-by-category-section";
import type { ApiCategory } from "@/lib/api/server";
import type { Course } from "@/types/course";

interface CategoryWithCourses {
  category: ApiCategory;
  courses: Course[];
}

interface AllCoursesClientProps {
  categoryData: CategoryWithCourses[];
}

export function AllCoursesClient({ categoryData }: AllCoursesClientProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  // The effect runs on mount too, which scrolled every visitor past the hero
  // into the card grid — and on a phone, past the page heading entirely. Guard
  // it so only a selection change moves the viewport; a browser-restored scroll
  // position is not a selection change, so it is left alone.
  const hasFiltered = useRef(false);

  useEffect(() => {
    if (!hasFiltered.current) {
      hasFiltered.current = true;
      return;
    }
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selected]);

  function handleToggle(slug: string) {
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  const categories = categoryData.map((d) => d.category);
  const visible =
    selected.length === 0
      ? categoryData
      : categoryData.filter((d) => selected.includes(d.category.slug));

  if (categoryData.length === 0) {
    return (
      <div className="bg-white">
        <div className="container py-16 text-center">
          <p className="font-open-sans text-[16px] text-neutral-400">
            No course categories available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="container py-12">
        {/* One column below `lg`; the 306px rail plus a three-column grid only
            fits inside the content column from `lg` up — `QA-COURSES-D1`. */}
        <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-start">
          <aside className="w-full lg:sticky lg:top-4 lg:w-[306px] lg:shrink-0">
            <CourseCategoryFilter
              categories={categories}
              selected={selected}
              onChange={handleToggle}
              onClear={() => setSelected([])}
            />
          </aside>

          <div ref={contentRef} className="flex min-w-0 flex-1 flex-col gap-16">
            {visible.length === 0 ? (
              <p className="font-open-sans text-[16px] text-neutral-400">No categories selected.</p>
            ) : (
              visible.map(({ category, courses }) => (
                <CoursesByCategorySection key={category.id} category={category} courses={courses} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
