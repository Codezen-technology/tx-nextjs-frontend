import { describe, it, expect } from "vitest";
import { resolveBulkTier, bulkTierUnitPrice } from "@/lib/utils/bulk-tiers";

const TIERS = [
  { min: 10, max: 19, percentage: 10 },
  { min: 20, max: 49, percentage: 15 },
  { min: 50, max: 0, percentage: 20 },
];

describe("resolveBulkTier", () => {
  it("returns null below the first tier", () => {
    expect(resolveBulkTier(TIERS, 9)).toBeNull();
  });

  it("matches the lower bound of a tier", () => {
    expect(resolveBulkTier(TIERS, 10)?.percentage).toBe(10);
  });

  it("matches the upper bound of a tier", () => {
    expect(resolveBulkTier(TIERS, 19)?.percentage).toBe(10);
  });

  it("moves to the next tier one past the upper bound", () => {
    expect(resolveBulkTier(TIERS, 20)?.percentage).toBe(15);
  });

  it("treats max 0 as open-ended", () => {
    expect(resolveBulkTier(TIERS, 5000)?.percentage).toBe(20);
  });

  it("picks the best discount when tiers overlap", () => {
    const overlapping = [
      { min: 10, max: 20, percentage: 10 },
      { min: 20, max: 40, percentage: 15 },
    ];
    expect(resolveBulkTier(overlapping, 20)?.percentage).toBe(15);
  });

  it("returns null for empty or missing tiers", () => {
    expect(resolveBulkTier([], 100)).toBeNull();
    expect(resolveBulkTier(undefined, 100)).toBeNull();
  });
});

describe("bulkTierUnitPrice", () => {
  it("returns the unit price unchanged with no tier", () => {
    expect(bulkTierUnitPrice(99, null)).toBe(99);
  });

  it("applies the tier percentage", () => {
    expect(bulkTierUnitPrice(100, { min: 10, max: 0, percentage: 15 })).toBe(85);
  });
});
