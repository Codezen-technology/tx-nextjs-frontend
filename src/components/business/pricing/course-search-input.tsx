"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useLicenceCourseSearch } from "@/lib/hooks/useBusinessPricing";
import type { LicenceCartItem, LicenceCourseItem } from "@/types/business-pricing";

interface CourseSearchInputProps {
  cartCourseIds: number[];
  onSelect: (item: LicenceCartItem) => void;
}

export function CourseSearchInput({ cartCourseIds, onSelect }: CourseSearchInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: courses = [], isFetching } = useLicenceCourseSearch(query);
  const filtered = courses.filter((c) => !cartCourseIds.includes(c.id));

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleSelect = (course: LicenceCourseItem) => {
    onSelect({
      courseId: course.id,
      courseName: course.name,
      qty: 1,
      pricePerLicence: course.price_per_licence,
      lineSubtotal: course.price_per_licence,
    });
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative mb-4">
      <div className="flex items-center overflow-hidden rounded-lg border border-neutral-200 focus-within:ring-2 focus-within:ring-[#3F576F]/30">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search for courses..."
          className="flex-1 px-4 py-2.5 text-sm outline-hidden"
        />
        <div className="px-3 text-neutral-400">
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
      </div>

      {open && query.length > 1 && (
        <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-neutral-500">
              {isFetching ? "Searching…" : "No courses found."}
            </div>
          ) : (
            filtered.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => handleSelect(course)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-blue-50"
              >
                <span className="font-medium text-neutral-900">{course.name}</span>
                <span className="ml-4 shrink-0 text-neutral-500">
                  £{course.price_per_licence.toFixed(2)}/licence
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
