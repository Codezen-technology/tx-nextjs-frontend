import { beforeEach, describe, expect, it, vi } from "vitest";

// The service is the only layer that knows about WP's shape, so the coercion is
// tested through it rather than against a hand-built numeric fixture. Mocking
// bffJson lets us hand it the exact payload the live API returned.
const bffJson = vi.fn();
vi.mock("@/lib/api/bff-client", () => ({ bffJson: (...args: unknown[]) => bffJson(...args) }));

import { businessDashboardService } from "@/lib/services/business-dashboard";
import {
  formatPoolCourseName,
  isMigratedCreditPool,
  poolAvailable,
  sumAvailableLicences,
  sumLicenceTotals,
} from "@/lib/utils/business-licences";
import type { LicencePool } from "@/types/business-dashboard";

/** Exactly what GET /licences/balance returned from tx-local-site: all strings. */
const RAW_POOL = {
  id: "7",
  business_id: "148",
  course_id: "111755",
  order_id: "0",
  quantity: "3",
  used: "1",
  price_per_licence: "0.00",
  discount_percent: "0",
  status: "active",
  created_at: "2026-07-06 16:56:28",
  updated_at: "2026-07-06 10:57:00",
  available: "2",
  course_name: "Level 5 Diploma",
};

describe("getLicenceBalance normalisation", () => {
  beforeEach(() => bffJson.mockReset());

  it("coerces $wpdb's string columns to numbers", async () => {
    bffJson.mockResolvedValue({ status: 1, pools: [RAW_POOL] });

    const { pools } = await businessDashboardService.getLicenceBalance();

    expect(pools[0].available).toBe(2);
    expect(pools[0].quantity).toBe(3);
    expect(pools[0].used).toBe(1);
    expect(pools[0].course_id).toBe(111755);
  });

  it("makes the totals add instead of concatenate", async () => {
    // The live bug: 0 + "2" + "5" === "025".
    bffJson.mockResolvedValue({
      status: 1,
      pools: [RAW_POOL, { ...RAW_POOL, id: "8", available: "5" }],
    });

    const { pools } = await businessDashboardService.getLicenceBalance();

    expect(sumAvailableLicences(pools)).toBe(7);
    expect(sumLicenceTotals(pools)).toEqual({ quantity: 6, used: 2 });
  });

  it("lets the universal-pool sentinel match again", async () => {
    // course_id arrived as "0", so course_id === 0 was never true.
    bffJson.mockResolvedValue({
      status: 1,
      pools: [{ ...RAW_POOL, course_id: "0", order_id: "0", price_per_licence: "0" }],
    });

    const { pools } = await businessDashboardService.getLicenceBalance();

    expect(pools[0].course_id).toBe(0);
    expect(formatPoolCourseName(pools[0])).toBe("Any course");
    expect(isMigratedCreditPool(pools[0])).toBe(true);
  });

  it("treats an unparseable figure as zero rather than NaN", async () => {
    bffJson.mockResolvedValue({ status: 1, pools: [{ ...RAW_POOL, available: null }] });

    const { pools } = await businessDashboardService.getLicenceBalance();

    expect(pools[0].available).toBe(0);
    expect(sumAvailableLicences(pools)).toBe(0);
  });
});

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
