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
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa5ac]" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search courses..."
          className="h-10 w-full rounded-lg border border-[#d9dde3] bg-white py-2 pl-9 pr-8 text-sm text-[#2e4450] placeholder:text-[#9aa5ac] focus:border-[#3f4d97] focus:outline-none focus:ring-1 focus:ring-[#3f4d97]"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9aa5ac] hover:text-[#2e4450]"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Sort */}
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="h-10 w-full border-[#d9dde3] bg-white text-sm text-[#2e4450] sm:w-[190px]">
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

      {/* Category */}
      {categories && categories.length > 0 && (
        <Select
          value={category?.toString() ?? "all"}
          onValueChange={(v) => onCategoryChange?.(v === "all" ? undefined : Number(v))}
        >
          <SelectTrigger className="h-10 w-full border-[#d9dde3] bg-white text-sm text-[#2e4450] sm:w-[200px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.term_id} value={String(cat.term_id)}>
                {cat.name}
                {cat.count > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">({cat.count})</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Reset — only when filters active */}
      {isFiltered && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          className="h-10 shrink-0 border-[#d9dde3] text-[#73828a] hover:text-[#2e4450]"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reset
        </Button>
      )}
    </div>
  );
}
