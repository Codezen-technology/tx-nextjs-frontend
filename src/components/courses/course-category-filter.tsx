"use client";

import { useId, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ApiCategory } from "@/lib/api/server";

/** Written once: the toggle and the desktop heading render the same label. */
const FILTER_LABEL = "Course Categories";

interface CourseCategoryFilterProps {
  categories: ApiCategory[];
  selected: string[];
  onChange: (slug: string) => void;
  onClear: () => void;
}

/**
 * Below `lg` the category list collapses behind a toggle, closed by default:
 * seventeen categories rendered open above the course list push the first card
 * roughly a viewport and a half down a phone screen (`QA-COURSES-D1`).
 *
 * Visibility is decided by a class, not a media-query hook — the state starts
 * closed on the server and on the first client render, and `lg:block` opens the
 * list from the desktop breakpoint up whatever the state says. A hook would
 * render the mobile branch on the server and flip after hydration.
 */
export function CourseCategoryFilter({
  categories,
  selected,
  onChange,
  onClear,
}: CourseCategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  return (
    <div className="border-neutral-30 rounded-[4px] border bg-white p-6">
      <div className="flex items-center justify-between lg:mb-6">
        {/* The heading is the toggle below `lg` and a plain heading from `lg` up,
            where the list is always open and a control would be inert. */}
        <h2 className="font-suse text-[20px] leading-[1.2] font-bold text-neutral-900">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={listId}
            className="flex cursor-pointer items-center gap-2 text-left lg:hidden"
          >
            {FILTER_LABEL}
            {selected.length > 0 && (
              <span className="font-open-sans text-secondary-500 text-[14px] font-normal">
                ({selected.length} selected)
              </span>
            )}
            <ChevronDown
              size={20}
              aria-hidden="true"
              className={cn("transition-transform", open && "rotate-180")}
            />
          </button>
          <span className="hidden lg:inline">{FILTER_LABEL}</span>
        </h2>
        {selected.length > 0 && (
          <button
            onClick={onClear}
            className="font-open-sans text-secondary-500 hover:text-secondary-600 text-[14px] leading-normal underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>

      <ul
        id={listId}
        className={cn("mt-6 flex-col gap-5 lg:mt-0 lg:flex", open ? "flex" : "hidden")}
      >
        {categories.map((cat) => {
          const isChecked = selected.includes(cat.slug);
          return (
            <li key={cat.id} className="flex items-center justify-between">
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => onChange(cat.slug)}
                className="flex cursor-pointer items-start gap-2.25"
              >
                <span
                  className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded ${
                    isChecked ? "bg-secondary-500" : "border border-neutral-50 bg-white"
                  }`}
                >
                  {isChecked && <Check size={16} className="text-white" strokeWidth={2.5} />}
                </span>
                <span className="font-open-sans text-left text-base leading-normal text-neutral-500">
                  {cat.name}
                </span>
              </button>
              <span className="font-open-sans text-sm leading-normal text-neutral-500">
                ({cat.count})
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
