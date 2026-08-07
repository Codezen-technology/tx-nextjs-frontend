"use client";

import Link from "next/link";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { useCourseCurriculum } from "@/lib/hooks/useCourses";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, pluralize } from "@/lib/utils/format";
import type { CourseSection } from "@/types/course";

interface CurriculumProps {
  courseId: number | string;
  sections?: CourseSection[];
  /** When true, units link into the learn player. */
  enrolled?: boolean;
}

export function Curriculum({ courseId, sections, enrolled = false }: CurriculumProps) {
  const { data, isLoading } = useCourseCurriculum(courseId, { enabled: !sections });
  const list = sections ?? data?.sections ?? [];

  if (isLoading && !sections) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!list.length) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
        Curriculum is not available for this course yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {list.map((section) => (
        <section key={section.id} className="space-y-2">
          <header className="flex items-center justify-between">
            <h3 className="font-semibold">{section.title}</h3>
            <span className="text-muted-foreground text-xs">
              {section.units.length} {pluralize(section.units.length, "unit")}
            </span>
          </header>
          <ul className="divide-y rounded-md border">
            {section.units.map((unit) => {
              const inner = (
                <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    {unit.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : enrolled || unit.isFreePreview ? (
                      <PlayCircle className="text-primary h-4 w-4 shrink-0" />
                    ) : (
                      <Lock className="text-muted-foreground h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">{unit.title}</span>
                  </div>
                  <div className="text-muted-foreground flex shrink-0 items-center gap-3 text-xs">
                    {unit.isFreePreview && !enrolled ? (
                      <span className="bg-muted rounded px-1.5 py-0.5">Preview</span>
                    ) : null}
                    {unit.durationSeconds ? (
                      <span>{formatDuration(unit.durationSeconds)}</span>
                    ) : null}
                  </div>
                </div>
              );

              const canOpen = enrolled || unit.isFreePreview;
              return (
                <li key={unit.id}>
                  {canOpen ? (
                    <Link
                      href={`/learn/${courseId}/${unit.id}`}
                      className="hover:bg-accent/50 block transition-colors"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="cursor-not-allowed opacity-70">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
