import { describe, it, expect } from "vitest";
import {
  WC_ATTRIBUTION_PREFIX,
  buildOrderAttributionMeta,
  buildStoreApiAttributionExtension,
  orderAttributionMetaFromRequest,
  storeApiAttributionFromRequest,
} from "@/lib/analytics/order-attribution";
import { COOKIE_FIRST, COOKIE_SESSION, encodeCookie } from "@/lib/analytics/attribution-cookies";
import type { FirstTouch, SessionTouch } from "@/lib/analytics/attribution";

const CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

const SESSION: SessionTouch = {
  source_type: "utm",
  referrer: "https://mail.google.com/",
  utm_source: "newsletter",
  utm_medium: "email",
  utm_campaign: "spring",
  utm_content: "hero",
  utm_term: "",
  utm_id: "",
  utm_source_platform: "",
  utm_creative_format: "",
  utm_marketing_tactic: "",
  session_entry: "https://tx.test/course/fire-warden",
  session_start_time: "2026-09-09 10:00:00",
  session_pages: 4,
};

const FIRST: FirstTouch = { ...SESSION, session_count: 3 };

function asMap(entries: Array<{ key: string; value: string }>): Record<string, string> {
  return Object.fromEntries(entries.map((e) => [e.key, e.value]));
}

describe("buildOrderAttributionMeta()", () => {
  it("prefixes every key with the WooCommerce namespace", () => {
    const meta = buildOrderAttributionMeta({ first: FIRST, session: SESSION }, CHROME);
    expect(meta.length).toBeGreaterThan(0);
    for (const entry of meta) {
      expect(entry.key.startsWith(WC_ATTRIBUTION_PREFIX)).toBe(true);
    }
  });

  it("takes the campaign from the session, which is the last touch", () => {
    const m = asMap(buildOrderAttributionMeta({ first: FIRST, session: SESSION }, CHROME));
    expect(m[`${WC_ATTRIBUTION_PREFIX}source_type`]).toBe("utm");
    expect(m[`${WC_ATTRIBUTION_PREFIX}utm_source`]).toBe("newsletter");
    expect(m[`${WC_ATTRIBUTION_PREFIX}utm_medium`]).toBe("email");
    expect(m[`${WC_ATTRIBUTION_PREFIX}utm_campaign`]).toBe("spring");
    expect(m[`${WC_ATTRIBUTION_PREFIX}session_entry`]).toBe("https://tx.test/course/fire-warden");
  });

  it("takes the lifetime session count from first-touch", () => {
    const m = asMap(buildOrderAttributionMeta({ first: FIRST, session: SESSION }, CHROME));
    expect(m[`${WC_ATTRIBUTION_PREFIX}session_count`]).toBe("3");
    expect(m[`${WC_ATTRIBUTION_PREFIX}session_pages`]).toBe("4");
  });

  it("derives the user agent and device type from the request, not the cookie", () => {
    const m = asMap(buildOrderAttributionMeta({ first: FIRST, session: SESSION }, CHROME));
    expect(m[`${WC_ATTRIBUTION_PREFIX}user_agent`]).toBe(CHROME);
    expect(m[`${WC_ATTRIBUTION_PREFIX}device_type`]).toBe("Desktop");
  });

  it("omits empty values so WooCommerce is not given blank meta rows", () => {
    const m = asMap(buildOrderAttributionMeta({ first: FIRST, session: SESSION }, CHROME));
    expect(m[`${WC_ATTRIBUTION_PREFIX}utm_term`]).toBeUndefined();
    expect(m[`${WC_ATTRIBUTION_PREFIX}utm_id`]).toBeUndefined();
  });

  it("still emits the session count when only the session cookie survived", () => {
    const m = asMap(buildOrderAttributionMeta({ first: null, session: SESSION }, CHROME));
    expect(m[`${WC_ATTRIBUTION_PREFIX}session_count`]).toBe("1");
  });

  it("returns nothing when there is no session, so a cookieless order is left untouched", () => {
    expect(buildOrderAttributionMeta({ first: FIRST, session: null }, CHROME)).toEqual([]);
  });
});

describe("orderAttributionMetaFromRequest()", () => {
  it("reads the cookies and user agent straight off the incoming request", () => {
    const req = new Request("https://tx.test/api/orders", {
      method: "POST",
      headers: {
        cookie: `${COOKIE_FIRST}=${encodeCookie(FIRST)}; ${COOKIE_SESSION}=${encodeCookie(SESSION)}`,
        "user-agent": CHROME,
      },
    });
    const m = asMap(orderAttributionMetaFromRequest(req));
    expect(m[`${WC_ATTRIBUTION_PREFIX}utm_source`]).toBe("newsletter");
    expect(m[`${WC_ATTRIBUTION_PREFIX}device_type`]).toBe("Desktop");
  });

  it("returns nothing for a request with no cookies", () => {
    const req = new Request("https://tx.test/api/orders", { method: "POST" });
    expect(orderAttributionMetaFromRequest(req)).toEqual([]);
  });
});

describe("buildStoreApiAttributionExtension()", () => {
  it("emits exactly the sixteen unprefixed field names WooCommerce declares", () => {
    const ext = buildStoreApiAttributionExtension({ first: FIRST, session: SESSION }, CHROME);
    expect(Object.keys(ext ?? {}).sort()).toEqual(
      [
        "referrer",
        "session_count",
        "session_entry",
        "session_pages",
        "session_start_time",
        "source_type",
        "user_agent",
        "utm_campaign",
        "utm_content",
        "utm_creative_format",
        "utm_id",
        "utm_marketing_tactic",
        "utm_medium",
        "utm_source",
        "utm_source_platform",
        "utm_term",
      ].sort(),
    );
  });

  it("omits device_type, which WooCommerce derives from the user agent itself", () => {
    const ext = buildStoreApiAttributionExtension({ first: FIRST, session: SESSION }, CHROME);
    expect(ext).not.toHaveProperty("device_type");
  });

  it("substitutes (none) for empty values instead of omitting the key", () => {
    const ext = buildStoreApiAttributionExtension({ first: FIRST, session: SESSION }, CHROME);
    expect(ext?.utm_term).toBe("(none)");
    expect(ext?.utm_id).toBe("(none)");
  });

  it("casts every value to a string, including the two counters", () => {
    const ext = buildStoreApiAttributionExtension({ first: FIRST, session: SESSION }, CHROME);
    for (const value of Object.values(ext ?? {})) {
      expect(typeof value).toBe("string");
    }
    expect(ext?.session_pages).toBe("4");
    expect(ext?.session_count).toBe("3");
  });

  it("returns null when there is no session, so the request body is left untouched", () => {
    expect(buildStoreApiAttributionExtension({ first: FIRST, session: null }, CHROME)).toBeNull();
  });
});

describe("storeApiAttributionFromRequest()", () => {
  it("builds the extension from the request's cookies", () => {
    const req = new Request("https://tx.test/api/cart/checkout", {
      method: "POST",
      headers: {
        cookie: `${COOKIE_FIRST}=${encodeCookie(FIRST)}; ${COOKIE_SESSION}=${encodeCookie(SESSION)}`,
        "user-agent": CHROME,
      },
    });
    expect(storeApiAttributionFromRequest(req)?.utm_source).toBe("newsletter");
  });

  it("returns null for a request with no cookies", () => {
    expect(
      storeApiAttributionFromRequest(
        new Request("https://tx.test/api/cart/checkout", { method: "POST" }),
      ),
    ).toBeNull();
  });
});
