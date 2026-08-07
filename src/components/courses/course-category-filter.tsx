"use client";

import { Check } from "lucide-react";
import type { ApiCategory } from "@/lib/api/server";

interface CourseCategoryFilterProps {
  categories: ApiCategory[];
  selected: string[];
  onChange: (slug: string) => void;
  onClear: () => void;
}

export function CourseCategoryFilter({
  categories,
  selected,
  onChange,
  onClear,
}: CourseCategoryFilterProps) {
  return (
    <div className="border-neutral-30 rounded-[4px] border bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-suse text-[20px] leading-[1.2] font-bold text-neutral-900">
          Course Categories
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

      <ul className="flex flex-col gap-5">
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
