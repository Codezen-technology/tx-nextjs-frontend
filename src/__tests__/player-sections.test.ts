import { describe, expect, it } from "vitest";
import { buildPlayerSections, getSectionStats } from "@/lib/player/sections";
import { calculatePlayerProgress } from "@/lib/player/progress";
import { PlayerItemType, type IPlayerCourse, type IPlayerUnit } from "@/types/player";

const unit = (id: number, status = 0, duration = 60): IPlayerUnit => ({
  key: id,
  id,
  type: PlayerItemType.Unit,
  title: `Unit ${id}`,
  duration,
  unit_type: "unit",
  content: "",
  status,
  icon: "",
  meta: [],
});

const section = (key: number, title: string): IPlayerUnit => ({
  key,
  id: 0,
  type: PlayerItemType.Section,
  title,
  duration: 0,
  unit_type: "section",
  content: "",
  status: 0,
  icon: "",
  meta: [],
});

describe("buildPlayerSections", () => {
  it("groups units under section markers", () => {
    const items = [section(1, "Intro"), unit(10), unit(11), section(2, "Outro"), unit(12)];
    const sections = buildPlayerSections(items);
    expect(sections).toHaveLength(2);
    expect(sections[0].units).toHaveLength(2);
    expect(sections[1].units).toHaveLength(1);
  });
});

describe("calculatePlayerProgress", () => {
  it("computes duration-weighted progress", () => {
    const course: IPlayerCourse = {
      course_id: 1,
      course_title: "Test",
      current_unit_key: 0,
      courseitems: [unit(1, 1, 100), unit(2, 0, 100)],
      lock: 0,
      assignment_locking: 0,
      assignment_lock_wait_for_instructor_approval: 0,
      disablescrollprogress: false,
      course_status: "2",
      instructions: "",
      progress: "50",
    };
    expect(calculatePlayerProgress(course)).toBe(50);
  });
});

describe("getSectionStats", () => {
  it("counts completed units in a section", () => {
    const stats = getSectionStats({
      key: 1,
      title: "A",
      units: [unit(1, 1), unit(2, 0)],
    });
    expect(stats.completedUnits).toBe(1);
    expect(stats.totalUnits).toBe(2);
  });
});
