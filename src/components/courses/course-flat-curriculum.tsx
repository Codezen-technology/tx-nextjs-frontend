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
  const totalSeconds = groups.reduce((acc, g) => acc + (g.section.section_duration ?? 0), 0);

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
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Curriculum is not available yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-suse text-[32px] font-bold leading-[1.2] text-neutral-900 sm:text-[38px]">
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
          className="text-sm font-medium text-secondary-500 hover:underline"
        >
          {allExpanded ? "Collapse all sections" : "Expand all sections"}
        </button>
      </div>

      {/* Sections */}
      <div className="overflow-hidden rounded-lg border border-[#ebedf1] bg-white shadow-sm">
        {groups.map((group, gi) => {
          const isOpen = openSections.has(gi);
          return (
            <div key={gi} className="border-b border-[#ebedf1] last:border-b-0">
              {/* Section header */}
              <button
                onClick={() => toggleSection(gi)}
                className="flex w-full items-center gap-3 bg-neutral-50 px-4 py-3.5 text-left transition-colors hover:bg-neutral-100"
                aria-expanded={isOpen}
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
                <span className="flex-1 text-sm font-semibold text-neutral-900">
                  {group.section.title}
                </span>
                <span className="shrink-0 text-xs text-neutral-500">
                  {group.units.length} {group.units.length === 1 ? "lecture" : "lectures"}
                  {group.section.section_duration
                    ? ` • ${formatDuration(group.section.section_duration)}`
                    : ""}
                </span>
              </button>

              {/* Units — always in DOM for SEO; visually hidden when collapsed */}
              <ul className={cn("divide-y divide-[#ebedf1]", !isOpen && "hidden")}>
                {group.units.map((unit, ui) => (
                  <li
                    key={ui}
                    className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <UnitIcon icon={unit.icon} />
                      <span className="truncate text-neutral-700">{unit.title}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-neutral-400">
                      {unit.is_free_preview ? (
                        <span className="rounded bg-secondary-50 px-1.5 py-0.5 font-medium text-secondary-600">
                          Preview
                        </span>
                      ) : null}
                      {unit.duration ? <span>{formatDuration(unit.duration)}</span> : null}
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
