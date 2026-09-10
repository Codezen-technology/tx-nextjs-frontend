import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { COOKIE_FIRST, COOKIE_SESSION, encodeCookie } from "@/lib/analytics/attribution-cookies";
import { WC_ATTRIBUTION_EXTENSION } from "@/lib/analytics/order-attribution";
import type { FirstTouch, SessionTouch } from "@/lib/analytics/attribution";

const proxyToWCStore = vi.fn();

vi.mock("@/lib/api/bff", () => ({
  proxyToWCStore: (path: string, options: unknown) => proxyToWCStore(path, options),
}));

const { POST: checkoutPOST } = await import("@/app/api/cart/checkout/route");
const { POST: storePayPOST } = await import("@/app/api/orders/[id]/store-pay/route");

const SESSION: SessionTouch = {
  source_type: "organic",
  referrer: "https://www.google.com/",
  utm_source: "google",
  utm_medium: "organic",
  utm_campaign: "",
  utm_content: "",
  utm_term: "",
  utm_id: "",
  utm_source_platform: "",
  utm_creative_format: "",
  utm_marketing_tactic: "",
  session_entry: "https://tx.test/",
  session_start_time: "2026-09-09 10:00:00",
  session_pages: 5,
};
const FIRST: FirstTouch = { ...SESSION, session_count: 2 };

/** The body the proxy was actually called with, for the most recent call. */
function sentBody(): Record<string, unknown> {
  const options = proxyToWCStore.mock.calls.at(-1)?.[1] as { body: Record<string, unknown> };
  return options.body;
}

function withCookies(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `${COOKIE_FIRST}=${encodeCookie(FIRST)}; ${COOKIE_SESSION}=${encodeCookie(SESSION)}`,
      "user-agent": "Mozilla/5.0 (Macintosh) Safari/537.36",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  proxyToWCStore.mockReset();
  proxyToWCStore.mockResolvedValue(NextResponse.json({ order_id: 777, status: "processing" }));
});

describe("POST /api/cart/checkout", () => {
  it("adds the WooCommerce attribution extension to the checkout body", async () => {
    await checkoutPOST(
      withCookies("https://tx.test/api/cart/checkout", { payment_method: "stripe" }),
    );

    const extensions = sentBody().extensions as Record<string, Record<string, string>>;
    const attribution = extensions[WC_ATTRIBUTION_EXTENSION];
    expect(attribution.source_type).toBe("organic");
    expect(attribution.utm_source).toBe("google");
    expect(attribution.session_count).toBe("2");
  });

  it("sends all sixteen fields, because WooCommerce warns on an omitted key", async () => {
    await checkoutPOST(withCookies("https://tx.test/api/cart/checkout", {}));

    const extensions = sentBody().extensions as Record<string, Record<string, string>>;
    expect(Object.keys(extensions[WC_ATTRIBUTION_EXTENSION])).toHaveLength(16);
    expect(extensions[WC_ATTRIBUTION_EXTENSION].utm_campaign).toBe("(none)");
  });

  it("preserves the caller's own body fields and any extensions already present", async () => {
    await checkoutPOST(
      withCookies("https://tx.test/api/cart/checkout", {
        payment_method: "stripe",
        extensions: { "acme/gift-note": { message: "hi" } },
      }),
    );

    const body = sentBody();
    expect(body.payment_method).toBe("stripe");
    const extensions = body.extensions as Record<string, unknown>;
    expect(extensions["acme/gift-note"]).toEqual({ message: "hi" });
    expect(extensions[WC_ATTRIBUTION_EXTENSION]).toBeDefined();
  });

  it("leaves the body untouched when the visitor has no attribution cookies", async () => {
    await checkoutPOST(
      new Request("https://tx.test/api/cart/checkout", {
        method: "POST",
        body: JSON.stringify({ payment_method: "stripe" }),
      }),
    );

    expect(sentBody().extensions).toBeUndefined();
  });

  it("strips attribution the caller put in the body, overwriting it with the cookie's", async () => {
    await checkoutPOST(
      withCookies("https://tx.test/api/cart/checkout", {
        extensions: {
          [WC_ATTRIBUTION_EXTENSION]: { source_type: "utm", utm_source: "spoofed" },
        },
      }),
    );

    const extensions = sentBody().extensions as Record<string, Record<string, string>>;
    expect(extensions[WC_ATTRIBUTION_EXTENSION].utm_source).toBe("google");
  });

  it("strips attribution the caller put in the body even with no cookies to replace it", async () => {
    await checkoutPOST(
      new Request("https://tx.test/api/cart/checkout", {
        method: "POST",
        body: JSON.stringify({
          payment_method: "stripe",
          extensions: {
            "acme/gift-note": { message: "hi" },
            [WC_ATTRIBUTION_EXTENSION]: { source_type: "utm", utm_source: "spoofed" },
          },
        }),
      }),
    );

    const extensions = sentBody().extensions as Record<string, unknown>;
    expect(extensions[WC_ATTRIBUTION_EXTENSION]).toBeUndefined();
    expect(extensions["acme/gift-note"]).toEqual({ message: "hi" });
  });

  it("returns the upstream response unchanged", async () => {
    const res = await checkoutPOST(withCookies("https://tx.test/api/cart/checkout", {}));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ order_id: 777 });
  });
});

describe("POST /api/orders/[id]/store-pay", () => {
  it("adds the same extension to the order-pay body", async () => {
    await storePayPOST(withCookies("https://tx.test/api/orders/900/store-pay", { key: "wc_x" }), {
      params: Promise.resolve({ id: "900" }),
    });

    const extensions = sentBody().extensions as Record<string, Record<string, string>>;
    expect(extensions[WC_ATTRIBUTION_EXTENSION].utm_source).toBe("google");
    expect(proxyToWCStore.mock.calls[0][0]).toMatch(/^\/checkout\/900(\?|$)/);
  });

  it("carries the PixelYourSite parameters on the query string", async () => {
    await storePayPOST(withCookies("https://tx.test/api/orders/900/store-pay", { key: "wc_x" }), {
      params: Promise.resolve({ id: "900" }),
    });

    const path = proxyToWCStore.mock.calls[0][0] as string;
    const query = new URLSearchParams(path.slice(path.indexOf("?")));
    expect(query.get("pys_source")).toBe("google");
    expect(query.get("last_pys_landing")).toBe("https://tx.test/");
  });

  it("rejects an invalid order id before reaching WooCommerce", async () => {
    const res = await storePayPOST(withCookies("https://tx.test/api/orders/abc/store-pay", {}), {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(400);
    expect(proxyToWCStore).not.toHaveBeenCalled();
  });
});
