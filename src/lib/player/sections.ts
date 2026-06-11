import { PlayerItemType, type IPlayerUnit } from "@/types/player";

export interface PlayerSection {
  key: number;
  title: string;
  units: IPlayerUnit[];
}

/** Group flat courseitems (section markers + units) into accordion sections. */
export function buildPlayerSections(items: IPlayerUnit[]): PlayerSection[] {
  const sections: PlayerSection[] = [];
  let current: PlayerSection | null = null;

  for (const item of items) {
    if (item.type === PlayerItemType.Section) {
      current = { key: item.key, title: item.title, units: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      current = { key: item.key, title: "", units: [] };
      sections.push(current);
    }
    current.units.push(item);
  }

  return sections;
}

export interface SectionStats {
  completedUnits: number;
  totalUnits: number;
  totalDuration: number;
  isComplete: boolean;
}

export function getSectionStats(section: PlayerSection): SectionStats {
  const completedUnits = section.units.filter((u) => u.status >= 1).length;
  const totalUnits = section.units.length;
  const totalDuration = section.units.reduce((acc, u) => acc + (u.duration || 0), 0);
  return {
    completedUnits,
    totalUnits,
    totalDuration,
    isComplete: totalUnits > 0 && completedUnits === totalUnits,
  };
}
