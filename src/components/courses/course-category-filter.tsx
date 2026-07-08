"use client";

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
        {categories.map((cat) => (
          <li key={cat.id} className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-[9px]">
              <input
                type="checkbox"
                checked={selected.includes(cat.slug)}
                onChange={() => onChange(cat.slug)}
                className="text-secondary-500 focus:ring-secondary-500 h-4 w-4 rounded border-neutral-50"
              />
              <span className="font-open-sans text-[16px] leading-normal text-neutral-500">
                {cat.name}
              </span>
            </label>
            <span className="font-open-sans text-[16px] leading-normal text-neutral-500">
              ({cat.count})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
