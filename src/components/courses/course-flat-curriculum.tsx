"use client";

import { useState } from "react";
import { ChevronDown, FileText, PlayCircle, HelpCircle, Book } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDuration } from "@/lib/utils/format";
import type { CourseFlatCurriculumItem } from "@/types/course";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  video: PlayCircle,
  quiz: HelpCircle,
  document: FileText,
  unit: Book,
};

function UnitIcon({ icon }: { icon?: string }) {
  const Icon = (icon && ICON_MAP[icon]) || Book;
  return <Icon className="h-4 w-4 shrink-0 text-neutral-400" />;
}

interface Group {
  section: CourseFlatCurriculumItem;
  units: CourseFlatCurriculumItem[];
}

function buildGroups(items: CourseFlatCurriculumItem[]): Group[] {
  return items.reduce<Group[]>((acc, item) => {
    if (item.type === "section") {
      acc.push({ section: item, units: [] });
    } else {
      acc.at(-1)?.units.push(item);
    }
    return acc;
  }, []);
}

interface CourseFlatCurriculumProps {
  items: CourseFlatCurriculumItem[];
}

export function CourseFlatCurriculum({ items }: CourseFlatCurriculumProps) {
  const groups = buildGroups(items);
  const sectionCount = groups.length;
  const unitCount = items.filter((i) => i.type !== "section").length;
  const totalSeconds = groups.reduce((acc, g) => acc + (g.section.durationSeconds ?? 0), 0);

  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
  const [allExpanded, setAllExpanded] = useState(false);

  function toggleSection(i: number) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  }

  function toggleAll() {
    if (allExpanded) {
      setOpenSections(new Set([0]));
    } else {
      setOpenSections(new Set(groups.map((_, i) => i)));
    }
    setAllExpanded((v) => !v);
  }

  if (!groups.length) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
        Curriculum is not available yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-suse text-[32px] leading-[1.2] font-medium text-neutral-900">
        Course Curriculum
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">
          {sectionCount} {sectionCount === 1 ? "section" : "sections"} &bull; {unitCount}{" "}
          {unitCount === 1 ? "lecture" : "lectures"}
          {totalSeconds > 0 ? ` • ${formatDuration(totalSeconds)} total` : ""}
        </p>
        <button
          onClick={toggleAll}
          className="text-secondary-500 text-sm font-medium hover:underline"
        >
          {allExpanded ? "Collapse all sections" : "Expand all sections"}
        </button>
      </div>

      {/* Sections */}
      <div className="border-neutral-30 mt-4 overflow-hidden border bg-white shadow-xs">
        {groups.map((group, gi) => {
          const isOpen = openSections.has(gi);
          return (
            <div key={gi} className="border-neutral-30 border-b last:border-b-0">
              {/* Section header */}
              <button
                onClick={() => toggleSection(gi)}
                className="bg-neutral-30 flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors"
                aria-expanded={isOpen}
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
                <span className="flex-1 text-lg font-bold text-neutral-900">
                  {group.section.title}
                </span>
                <span className="shrink-0 text-base text-neutral-500">
                  {group.units.length} {group.units.length === 1 ? "lecture" : "lectures"}
                  {group.section.durationSeconds
                    ? ` • ${formatDuration(group.section.durationSeconds)}`
                    : ""}
                </span>
              </button>

              {/* Units — always in DOM for SEO; visually hidden when collapsed */}
              <ul className={cn("divide-neutral-30 divide-y", !isOpen && "hidden")}>
                {group.units.map((unit, ui) => (
                  <li
                    key={ui}
                    className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <UnitIcon icon={unit.icon} />
                      <span className="text-secondary-500 truncate text-base font-normal">
                        {unit.title}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-neutral-400">
                      {unit.is_free_preview ? (
                        <span className="bg-secondary-50 text-secondary-600 rounded px-1.5 py-0.5 font-medium">
                          Preview
                        </span>
                      ) : null}
                      {unit.durationSeconds ? (
                        <span className="text-base">{formatDuration(unit.durationSeconds)}</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
