import { describe, it, expect } from "vitest";
import { categoryCtaLabel, categoryCtaText } from "@/lib/utils/category-label";
import { COURSE_CATEGORY_NAMES } from "./fixtures/course-categories";

/** Occurrences of the standalone word "course"/"courses", case-insensitive. */
function countCourseWord(text: string): number {
  return text.match(/\bcourses?\b/gi)?.length ?? 0;
}

describe("categoryCtaLabel", () => {
  it("strips a trailing plural Courses", () => {
    expect(categoryCtaLabel("Care Certificate Courses")).toBe("Care Certificate");
  });

  it("strips a trailing singular Course", () => {
    expect(categoryCtaLabel("Fire Marshal Course")).toBe("Fire Marshal");
  });

  it("leaves a name that carries no course suffix", () => {
    expect(categoryCtaLabel("Groupon")).toBe("Groupon");
  });

  it("leaves the name alone when the suffix is the whole name", () => {
    expect(categoryCtaLabel("Courses")).toBe("Courses");
    expect(categoryCtaLabel("Course")).toBe("Course");
  });

  it("preserves the remaining name's casing", () => {
    expect(categoryCtaLabel("HACCP Courses")).toBe("HACCP");
    expect(categoryCtaLabel("Health and Social Care Courses")).toBe("Health and Social Care");
  });

  it("matches the suffix case-insensitively and tolerates trailing whitespace", () => {
    expect(categoryCtaLabel("Food Hygiene COURSES")).toBe("Food Hygiene");
    expect(categoryCtaLabel("Food Hygiene courses  ")).toBe("Food Hygiene");
  });

  it("only strips a trailing occurrence, never one mid-name", () => {
    expect(categoryCtaLabel("Courses for Teams")).toBe("Courses for Teams");
  });

  it("returns an empty string unchanged", () => {
    expect(categoryCtaLabel("")).toBe("");
  });
});

describe("categoryCtaText", () => {
  it("says the word once for a suffixed name", () => {
    expect(categoryCtaText("Care Certificate Courses")).toBe("View all Care Certificate courses");
  });

  it("says the word once for an unsuffixed name", () => {
    expect(categoryCtaText("Groupon")).toBe("View all Groupon courses");
  });

  // QA-COURSES-A4: the defect was the CTA saying "courses" twice, so this is
  // the assertion that has to hold for every name the CMS can serve.
  it.each(COURSE_CATEGORY_NAMES)("says the word exactly once for %s", (name) => {
    expect(countCourseWord(categoryCtaText(name))).toBe(1);
  });
});
