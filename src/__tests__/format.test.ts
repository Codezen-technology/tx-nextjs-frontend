import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatCardDate,
  formatDuration,
  stripHtml,
  truncate,
  pluralize,
} from "@/lib/utils/format";

describe("truncate", () => {
  it("returns text unchanged when within limit", () => {
    expect(truncate("short", 160)).toBe("short");
  });

  it("truncates to max and appends ellipsis", () => {
    const long = "a".repeat(200);
    const result = truncate(long, 160);
    expect(result.length).toBe(160);
    expect(result.endsWith("…")).toBe(true);
  });

  it("handles text exactly at limit", () => {
    const text = "a".repeat(160);
    expect(truncate(text, 160)).toBe(text);
  });

  it("uses 160 as default max", () => {
    const long = "x".repeat(200);
    expect(truncate(long).length).toBe(160);
  });
});

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("handles nested tags", () => {
    expect(stripHtml("<div><span><a href='#'>link</a></span></div>")).toBe("link");
  });

  it("returns empty string for null/undefined", () => {
    expect(stripHtml(null)).toBe("");
    expect(stripHtml(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(stripHtml("")).toBe("");
  });

  it("trims surrounding whitespace", () => {
    expect(stripHtml("  <p>text</p>  ")).toBe("text");
  });
});

describe("formatDate", () => {
  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("returns empty string for invalid date string", () => {
    expect(formatDate("not-a-date")).toBe("");
  });

  it("formats a valid ISO date string", () => {
    const result = formatDate("2024-01-15T00:00:00Z");
    expect(result).toBeTruthy();
    expect(result).toContain("2024");
  });

  it("accepts a Date object", () => {
    const result = formatDate(new Date("2024-06-01T00:00:00Z"));
    expect(result).toContain("2024");
  });
});

describe("formatDuration", () => {
  it("returns '0m' for null/undefined/zero", () => {
    expect(formatDuration(null)).toBe("0m");
    expect(formatDuration(undefined)).toBe("0m");
    expect(formatDuration(0)).toBe("0m");
  });

  it("formats seconds under an hour as minutes", () => {
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(90)).toBe("1m");
    expect(formatDuration(3599)).toBe("59m");
  });

  it("formats durations over an hour with hours and minutes", () => {
    expect(formatDuration(3600)).toBe("1h 0m");
    expect(formatDuration(3660)).toBe("1h 1m");
    expect(formatDuration(7200)).toBe("2h 0m");
  });

  it("returns '0m' for negative values", () => {
    expect(formatDuration(-10)).toBe("0m");
  });
});

describe("pluralize", () => {
  it("returns singular for count of 1", () => {
    expect(pluralize(1, "course")).toBe("course");
  });

  it("returns plural with 's' suffix for other counts", () => {
    expect(pluralize(0, "course")).toBe("courses");
    expect(pluralize(2, "course")).toBe("courses");
  });

  it("uses provided plural form when given", () => {
    expect(pluralize(2, "quiz", "quizzes")).toBe("quizzes");
    expect(pluralize(1, "quiz", "quizzes")).toBe("quiz");
  });
});

describe("formatCardDate", () => {
  it("uses the short month form so card meta lines do not overflow at 440", () => {
    expect(formatCardDate("2026-09-03T10:00:00")).toBe("3 Sep 2026");
    expect(formatCardDate("2026-01-15T10:00:00")).toBe("15 Jan 2026");
  });

  it("never emits a full month name", () => {
    const months = Array.from({ length: 12 }, (_, m) => formatCardDate(new Date(2026, m, 10, 12)));
    expect(months.some((s) => /January|February|September|December/.test(s))).toBe(false);
    expect(months.every((s) => /^\d{1,2} [A-Z][a-z]{2} 2026$/.test(s))).toBe(true);
  });

  it("returns the raw string for an unparsable date rather than 'Invalid Date'", () => {
    expect(formatCardDate("not-a-date")).toBe("not-a-date");
    expect(formatCardDate(null)).toBe("");
  });
});
