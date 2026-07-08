"use client";

import { RotateCcw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CourseCategory } from "@/types/student-dashboard";

export type SortOption = "recently_accessed" | "title" | "date";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recently_accessed", label: "Recently accessed" },
  { value: "title", label: "Title A–Z" },
  { value: "date", label: "Date enrolled" },
];

interface CourseFilterBarProps {
  search: string;
  sort: SortOption;
  category?: number;
  categories?: CourseCategory[];
  onSearchChange: (v: string) => void;
  onSortChange: (v: SortOption) => void;
  onCategoryChange?: (v: number | undefined) => void;
  onReset: () => void;
}

export function CourseFilterBar({
  search,
  sort,
  category,
  categories,
  onSearchChange,
  onSortChange,
  onCategoryChange,
  onReset,
}: CourseFilterBarProps) {
  const isFiltered = !!search || sort !== "recently_accessed" || !!category;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-6">
      {/* Left: Sort + Category + Reset */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="h-10 w-[200px] rounded-lg border-[#d9dde3] bg-white text-sm text-[#2e4450]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {categories && categories.length > 0 && (
          <Select
            value={category?.toString() ?? "all"}
            onValueChange={(v) => onCategoryChange?.(v === "all" ? undefined : Number(v))}
          >
            <SelectTrigger className="h-10 w-[200px] rounded-lg border-[#d9dde3] bg-white text-sm text-[#2e4450]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.term_id} value={String(cat.term_id)}>
                  {cat.name}
                  {cat.count > 0 && (
                    <span className="text-muted-foreground ml-1 text-xs">({cat.count})</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-10 shrink-0 text-[#73828a] hover:text-[#2e4450]"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Right: Search — 56px tall, navy border, blue icon button */}
      <div className="relative w-full sm:w-80">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search courses"
          className="h-14 w-full rounded-lg border border-[#3f4d97] bg-[#f6f6fa] py-2 pr-14 pl-4 text-[18px] text-[#28303f] placeholder:text-[#73828a] focus:ring-1 focus:ring-[#3f4d97] focus:outline-hidden"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded bg-[#3f4d97] text-white transition hover:bg-[#2e3a7a]"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <span className="pointer-events-none absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded bg-[#3f4d97]">
            <Search className="h-4 w-4 text-white" />
          </span>
        )}
      </div>
    </div>
  );
}
