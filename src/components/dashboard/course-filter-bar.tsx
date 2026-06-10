"use client";

import { RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption = "recently_accessed" | "title" | "date";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recently_accessed", label: "Recently accessed" },
  { value: "title", label: "Title A–Z" },
  { value: "date", label: "Date enrolled" },
];

interface CourseFilterBarProps {
  search: string;
  sort: SortOption;
  onSearchChange: (v: string) => void;
  onSortChange: (v: SortOption) => void;
  onReset: () => void;
}

export function CourseFilterBar({
  search,
  sort,
  onSearchChange,
  onSortChange,
  onReset,
}: CourseFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search courses..."
          className="pl-9"
        />
      </div>
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="w-full sm:w-[200px]">
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
      <Button type="button" variant="outline" onClick={onReset} className="shrink-0">
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset
      </Button>
    </div>
  );
}
