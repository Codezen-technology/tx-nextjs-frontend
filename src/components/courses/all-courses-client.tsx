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

  useEffect(() => {
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
        <div className="flex items-start gap-6">
          <aside className="sticky top-4 w-[306px] shrink-0">
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
