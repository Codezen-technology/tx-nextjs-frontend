import { describe, it, expect } from "vitest";
import { normalizeWhySection } from "@/lib/services/home";
import type { HomeWhyFeature } from "@/types/home";

const FEATURES: HomeWhyFeature[] = [
  { icon: "clock", title: "Flexible Online Learning", description: "Study anytime." },
  { icon: "shield-check", title: "Recognised & Accredited", description: "Trusted bodies." },
];

describe("normalizeWhySection", () => {
  it("reads the object shape newer plugin builds send", () => {
    expect(normalizeWhySection({ items: FEATURES, image: "https://cdn.example/why.webp" })).toEqual(
      {
        items: FEATURES,
        image: "https://cdn.example/why.webp",
      },
    );
  });

  it("reads the bare array older builds — including production — still send", () => {
    // Reaching for `.items` here yields undefined, which blanks the whole
    // Why Choose Us section on the homepage with nothing logged.
    expect(normalizeWhySection(FEATURES)).toEqual({ items: FEATURES, image: "" });
  });

  it("falls back to the static image when the object omits one", () => {
    expect(normalizeWhySection({ items: FEATURES } as never).image).toBe("");
  });

  it("survives a missing block", () => {
    expect(normalizeWhySection(undefined)).toEqual({ items: [], image: "" });
  });
});
