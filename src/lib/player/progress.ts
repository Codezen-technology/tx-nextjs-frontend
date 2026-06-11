import { PlayerItemType, type IPlayerCourse, type IPlayerUnit } from "@/types/player";

/** Duration-weighted progress; takes min with WPLMS server value when present. */
export function calculatePlayerProgress(course: IPlayerCourse): number {
  const units = course.courseitems.filter((i) => i.type !== PlayerItemType.Section);
  const totalDuration = units.reduce((acc, u) => acc + (u.duration || 0), 0);
  const completedDuration = units
    .filter((u) => u.status >= 1)
    .reduce((acc, u) => acc + (u.duration || 0), 0);

  const calculated = totalDuration > 0 ? Math.round((completedDuration / totalDuration) * 100) : 0;
  const server = Number.parseInt(course.progress, 10) || 0;

  if (server > 0) return Math.min(calculated, server);
  return calculated;
}

export function getPlayableUnits(course: IPlayerCourse) {
  return course.courseitems.filter((i) => i.type !== PlayerItemType.Section);
}

/** First incomplete unit after `afterUnitId` in curriculum order. */
export function getNextIncompleteUnit(
  items: IPlayerUnit[],
  afterUnitId: number,
): IPlayerUnit | null {
  const idx = items.findIndex((u) => u.id === afterUnitId);
  if (idx < 0) return null;

  for (let i = idx + 1; i < items.length; i++) {
    if (items[i].status < 1) return items[i];
  }
  return null;
}
