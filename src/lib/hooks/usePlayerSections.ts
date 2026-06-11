"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildPlayerSections,
  getSectionStats,
  type PlayerSection,
  type SectionStats,
} from "@/lib/player/sections";
import type { IPlayerUnit } from "@/types/player";

export function usePlayerSections(items: IPlayerUnit[], activeUnitId: number) {
  const sections = useMemo(() => buildPlayerSections(items), [items]);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  // Auto-expand the section containing the active unit.
  useEffect(() => {
    const idx = sections.findIndex((s) => s.units.some((u) => u.id === activeUnitId));
    if (idx >= 0) {
      setExpandedSections((prev) => (prev.includes(idx) ? prev : [idx]));
    }
  }, [sections, activeUnitId]);

  const toggleSection = useCallback((index: number) => {
    setExpandedSections((prev) => (prev.includes(index) ? [] : [index]));
  }, []);

  const getStats = useCallback(
    (section: PlayerSection): SectionStats => getSectionStats(section),
    [],
  );

  return { sections, expandedSections, toggleSection, getSectionStats: getStats };
}
