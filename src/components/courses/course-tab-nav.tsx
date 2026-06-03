"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { CourseAccreditation, CourseSections, CourseFlatCurriculumItem } from "@/types/course";

interface NavItem {
  id: string;
  label: string;
}

interface CourseTabNavProps {
  accreditations: CourseAccreditation[];
  curriculum: CourseFlatCurriculumItem[];
  sections: CourseSections | null;
  courseId: number | string;
}

export function CourseTabNav({
  accreditations,
  curriculum,
  sections,
  courseId: _courseId,
}: CourseTabNavProps) {
  const [active, setActive] = useState<string>("");

  const items: NavItem[] = [
    ...(accreditations.length ? [{ id: "accreditations", label: "Accreditations" }] : []),
    ...(curriculum.length ? [{ id: "course-content", label: "Course Content" }] : []),
    ...(sections?.faq?.length ? [{ id: "faq", label: "FAQs" }] : []),
    { id: "reviews", label: "Reviews" },
    ...(sections?.who_should_take?.items?.length
      ? [{ id: "suitable-for", label: "Suitable For" }]
      : []),
  ];

  useEffect(() => {
    if (!items.length) return;

    const sectionEls = items
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items.map((i) => i.id).join(",")]);

  if (!items.length) return null;

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 100;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    setActive(id);
  }

  return (
    <div className="sticky top-[72px] z-30 -mx-4 mt-12 border-b border-neutral-30 bg-white px-4 sm:top-20 lg:top-24">
      <nav className="flex gap-0 overflow-x-auto" aria-label="Course sections">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollTo(item.id)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-4 font-open-sans text-[13px] font-medium uppercase tracking-wide transition-colors sm:text-[15px]",
              active === item.id
                ? "border-secondary-500 text-secondary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-800",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
