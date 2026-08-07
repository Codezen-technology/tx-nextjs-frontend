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
  hasScreenshots: boolean;
  hasReviews: boolean;
  sections: CourseSections | null;
  courseId: number | string;
}

export function CourseTabNav({
  accreditations,
  curriculum,
  hasScreenshots,
  hasReviews,
  sections,
  courseId: _courseId,
}: CourseTabNavProps) {
  const [active, setActive] = useState<string>("");

  const items: NavItem[] = [
    ...(accreditations.length ? [{ id: "accreditations", label: "Accreditations" }] : []),
    ...(hasScreenshots ? [{ id: "course-content", label: "Course Content" }] : []),
    ...(curriculum.length ? [{ id: "curriculum", label: "Course Curriculum" }] : []),
    ...(sections?.who_should_take?.items?.length
      ? [{ id: "suitable-for", label: "Suitable For" }]
      : []),
    ...(sections?.job_opportunities?.items?.length
      ? [{ id: "job-opportunities", label: "Job Opportunities" }]
      : []),
    ...(sections?.why_take ? [{ id: "why-take", label: "Why Take?" }] : []),
    ...(sections?.requirements ? [{ id: "requirements", label: "Requirements" }] : []),
    ...(sections?.assessment ? [{ id: "assessment", label: "Assessment" }] : []),
    ...(sections?.faq?.length ? [{ id: "faq", label: "FAQs" }] : []),
    ...(hasReviews ? [{ id: "reviews", label: "Reviews" }] : []),
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
    <div className="sticky top-0 z-30 -mx-4 mt-12 bg-white px-4 py-4">
      <nav className="flex flex-wrap gap-2.5 overflow-x-auto" aria-label="Course sections">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollTo(item.id)}
            className={cn(
              "shrink-0 rounded px-5 py-2 font-open-sans text-sm font-semibold transition-colors",
              active === item.id
                ? "bg-primary-600 text-white"
                : "bg-primary-500 text-white hover:bg-primary-600",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
