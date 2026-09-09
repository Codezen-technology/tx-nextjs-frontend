import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_FIRST, COOKIE_SESSION, encodeCookie } from "@/lib/analytics/attribution-cookies";
import { WC_ATTRIBUTION_PREFIX } from "@/lib/analytics/order-attribution";
import type { FirstTouch, SessionTouch } from "@/lib/analytics/attribution";

const createWCOrder = vi.fn();

vi.mock("@/lib/api/wc-orders", () => ({
  createWCOrder: (payload: unknown) => createWCOrder(payload),
  getAuthenticatedUserId: async () => null,
  setGuestOrderKeyCookie: async () => undefined,
  validateCouponCode: async () => null,
  validateLineItems: async () => null,
  wcBasicAuthHeader: () => "Basic test",
  updateWCOrder: async () => null,
}));

const { POST } = await import("@/app/api/orders/route");

const SESSION: SessionTouch = {
  source_type: "utm",
  referrer: "https://mail.google.com/",
  utm_source: "newsletter",
  utm_medium: "email",
  utm_campaign: "spring",
  utm_content: "",
  utm_term: "",
  utm_id: "",
  utm_source_platform: "",
  utm_creative_format: "",
  utm_marketing_tactic: "",
  session_entry: "https://tx.test/course/fire-warden",
  session_start_time: "2026-09-09 10:00:00",
  session_pages: 2,
};
const FIRST: FirstTouch = { ...SESSION, session_count: 1 };

const BODY = JSON.stringify({
  payment_method: "stripe",
  billing: { email: "jane@example.com" },
  line_items: [{ product_id: 12, quantity: 1 }],
});

function orderRequest(withCookies: boolean): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (withCookies) {
    headers.cookie = `${COOKIE_FIRST}=${encodeCookie(FIRST)}; ${COOKIE_SESSION}=${encodeCookie(SESSION)}`;
  }
  return new Request("https://tx.test/api/orders", { method: "POST", headers, body: BODY });
}

beforeEach(() => {
  createWCOrder.mockReset();
  createWCOrder.mockResolvedValue({
    ok: true,
    order: { id: 501, order_key: "wc_order_x", status: "pending", total: "29.99", currency: "GBP" },
  });
});

// The route returns 503 here because no Stripe secret is configured in the test
// environment. That happens *after* the order is created, so the payload these
// tests assert on is already complete. Deliberately not stubbing Stripe keeps
// this test focused on the attribution payload.
describe("POST /api/orders", () => {
  it("attaches WooCommerce attribution meta read from the visitor's cookies", async () => {
    await POST(orderRequest(true));
    const payload = createWCOrder.mock.calls[0][0] as {
      meta_data?: Array<{ key: string; value: string }>;
    };
    const map = Object.fromEntries((payload.meta_data ?? []).map((m) => [m.key, m.value]));
    expect(map[`${WC_ATTRIBUTION_PREFIX}utm_source`]).toBe("newsletter");
    expect(map[`${WC_ATTRIBUTION_PREFIX}utm_campaign`]).toBe("spring");
    expect(map[`${WC_ATTRIBUTION_PREFIX}source_type`]).toBe("utm");
  });

  it("creates the order unchanged when the visitor has no attribution cookies", async () => {
    await POST(orderRequest(false));
    const payload = createWCOrder.mock.calls[0][0] as { meta_data?: unknown };
    expect(payload.meta_data).toBeUndefined();
  });
});
