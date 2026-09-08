import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The webhook is the fulfilment safety net for the browser-crash case, so it must
 * resolve the same product the confirm path does — off the signed PaymentIntent
 * metadata (`cert_product`), not off anything a caller supplies.
 */

const WEBHOOK_SECRET = "whsec_test";

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_SECRET_KEY: "sk_test_x",
    WP_INTERNAL_SECRET: "shh",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
  },
  getServerWpJsonBase: () => "https://wp.test/wp-json",
}));

const { POST: webhookPOST } = await import("@/app/api/certificate/webhook/route");

let calls: { url: string; body: Record<string, unknown> }[];

function signedRequest(event: unknown): Request {
  const raw = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(`${timestamp}.${raw}`, "utf8")
    .digest("hex");

  return new Request("https://x.test/api/certificate/webhook", {
    method: "POST",
    headers: { "stripe-signature": `t=${timestamp},v1=${signature}` },
    body: raw,
  });
}

function succeededEvent(metadata: Record<string, string>) {
  return {
    type: "payment_intent.succeeded",
    data: { object: { id: "pi_1", amount: 2298, currency: "gbp", metadata } },
  };
}

beforeEach(() => {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init?.body)) as Record<string, unknown> });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("POST /api/certificate/webhook", () => {
  it("records against the scoped path for the product on the signed PaymentIntent", async () => {
    const res = await webhookPOST(signedRequest(succeededEvent({ cert_product: "hardcopy" })));
    expect(res.status).toBe(200);
    expect(calls[0]?.url).toContain("/certificate/hardcopy/record");
  });

  it("forwards the signed metadata the plugin re-reads the product from", async () => {
    // The plugin prefers `cert_product` in this metadata over the request path, so
    // the two can never disagree about which form the order is written into.
    await webhookPOST(signedRequest(succeededEvent({ cert_product: "hardcopy" })));
    expect((calls[0]?.body.metadata as Record<string, string>).cert_product).toBe("hardcopy");
  });

  it("agrees with the confirm path for a default-product order", async () => {
    await webhookPOST(signedRequest(succeededEvent({ cert_product: "default" })));
    expect(calls[0]?.url).toMatch(/\/certificate\/record$/);
  });

  it("uses the unscoped alias when the PI carries no product", async () => {
    await webhookPOST(signedRequest(succeededEvent({ cert_email: "a@b.test" })));
    expect(calls[0]?.url).toMatch(/\/certificate\/record$/);
  });

  it("ignores an unrecognised product on the PI", async () => {
    await webhookPOST(signedRequest(succeededEvent({ cert_product: "22" })));
    expect(calls[0]?.url).toMatch(/\/certificate\/record$/);
  });

  it("still rejects an unsigned request", async () => {
    const res = await webhookPOST(
      new Request("https://x.test/api/certificate/webhook", {
        method: "POST",
        body: JSON.stringify(succeededEvent({ cert_product: "hardcopy" })),
      }),
    );
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });
});
