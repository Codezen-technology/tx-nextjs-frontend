import { describe, expect, it } from "vitest";
import {
  formatPoolCourseName,
  isMigratedCreditPool,
  poolAvailable,
  sumAvailableLicences,
  sumLicenceTotals,
} from "@/lib/utils/business-licences";
import type { LicencePool } from "@/types/business-dashboard";

/** Shaped like a normalised pool — see normaliseLicencePool in the service. */
function pool(overrides: Partial<LicencePool> = {}): LicencePool {
  return {
    id: 7,
    business_id: 148,
    course_id: 111755,
    order_id: 0,
    quantity: 3,
    used: 1,
    available: 2,
    price_per_licence: 0,
    discount_percent: 0,
    status: "active",
    created_at: "2026-07-06 16:56:28",
    updated_at: "2026-07-06 10:57:00",
    course_name: "Level 5 Diploma",
    ...overrides,
  };
}

describe("sumAvailableLicences", () => {
  it("adds rather than concatenates across pools", () => {
    expect(sumAvailableLicences([pool({ available: 2 }), pool({ available: 5 })])).toBe(7);
  });

  it("is zero for no pools", () => {
    expect(sumAvailableLicences([])).toBe(0);
  });
});

describe("sumLicenceTotals", () => {
  it("sums quantity and used numerically", () => {
    const totals = sumLicenceTotals([
      pool({ quantity: 3, used: 1 }),
      pool({ quantity: 10, used: 4 }),
    ]);
    expect(totals).toEqual({ quantity: 13, used: 5 });
  });
});

describe("poolAvailable", () => {
  it("prefers the server's available count", () => {
    expect(poolAvailable(pool({ quantity: 3, used: 1, available: 2 }))).toBe(2);
  });
});

describe("universal pools", () => {
  // course_id 0 is the sentinel for "any course". It only matches once the
  // service has coerced $wpdb's string columns to numbers.
  it("names a course_id 0 pool as universal", () => {
    expect(formatPoolCourseName({ course_id: 0, course_name: "" })).toBe("Any course");
    expect(formatPoolCourseName({ course_id: 111755, course_name: "Fire Safety" })).toBe(
      "Fire Safety",
    );
  });

  it("detects a migrated credit pool", () => {
    expect(isMigratedCreditPool(pool({ course_id: 0, order_id: 0, price_per_licence: 0 }))).toBe(
      true,
    );
    expect(isMigratedCreditPool(pool())).toBe(false);
  });
});
