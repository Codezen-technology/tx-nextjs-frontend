"use client";

import { useEffect, useMemo, useState } from "react";
import { buildPlayerSections, type PlayerSection } from "@/lib/player/sections";
import type { IPlayerUnit } from "@/types/player";

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useCourseSearch(items: IPlayerUnit[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim().toLowerCase());
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  const sections = useMemo(() => buildPlayerSections(items), [items]);

  const filteredSections = useMemo((): PlayerSection[] => {
    if (!debouncedSearchQuery) return [];
    return sections
      .map((section) => ({
        ...section,
        units: section.units.filter((u) => u.title.toLowerCase().includes(debouncedSearchQuery)),
      }))
      .filter((s) => s.units.length > 0);
  }, [sections, debouncedSearchQuery]);

  const totalMatches = filteredSections.reduce((acc, s) => acc + s.units.length, 0);

  const toggleSection = (index: number) => {
    setExpandedSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  return {
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    isSearching: searchQuery !== debouncedSearchQuery && searchQuery.length > 0,
    filteredSections,
    expandedSections,
    toggleSection,
    totalMatches,
  };
}
