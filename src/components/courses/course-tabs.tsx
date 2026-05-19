"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { CourseAccreditations } from "@/components/courses/course-accreditations";
import { CourseFlatCurriculum } from "@/components/courses/course-flat-curriculum";
import { CourseFaq } from "@/components/courses/course-faq";
import { CourseReviews } from "@/components/courses/course-reviews";
import { CourseSuitableFor } from "@/components/courses/course-suitable-for";
import type { CourseAccreditation, CourseSections, CourseFlatCurriculumItem } from "@/types/course";

type TabId = "accreditations" | "content" | "faq" | "reviews" | "suitable";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "accreditations", label: "Accreditations" },
  { id: "content", label: "Course Content" },
  { id: "faq", label: "FAQs" },
  { id: "reviews", label: "Reviews" },
  { id: "suitable", label: "Suitable For" },
];

interface CourseTabsProps {
  courseId: number | string;
  accreditations: CourseAccreditation[];
  curriculum: CourseFlatCurriculumItem[];
  sections: CourseSections | null;
}

export function CourseTabs({
  courseId,
  accreditations,
  curriculum,
  sections,
}: CourseTabsProps) {
  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === "accreditations" && !accreditations.length) return false;
    if (tab.id === "content" && !curriculum.length) return false;
    if (tab.id === "faq" && !sections?.faq?.length) return false;
    if (tab.id === "suitable" && !sections?.who_should_take?.items?.length) return false;
    return true;
  });

  const [activeTab, setActiveTab] = useState<TabId>(visibleTabs[0]?.id ?? "reviews");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="border-b border-[#ebedf1]">
        <nav className="-mb-px flex overflow-x-auto gap-0">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 border-b-2 px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-secondary-500 text-secondary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300",
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "accreditations" && (
          <CourseAccreditations accreditations={accreditations} />
        )}
        {activeTab === "content" && <CourseFlatCurriculum items={curriculum} />}
        {activeTab === "faq" && (
          <CourseFaq
            heading={sections?.faq_heading}
            items={sections?.faq ?? []}
          />
        )}
        {activeTab === "reviews" && <CourseReviews courseId={courseId} />}
        {activeTab === "suitable" && (
          <CourseSuitableFor
            heading={sections?.who_should_take?.summary}
            items={sections?.who_should_take?.items ?? []}
          />
        )}
      </div>
    </div>
  );
}
