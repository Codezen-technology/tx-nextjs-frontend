import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The product slug is what selected the prices a customer was charged, so it must
 * travel inside Stripe's copy of the PaymentIntent — never be restated by the
 * browser at confirm time. These tests pin that both recording paths (client
 * confirm and Stripe webhook) read `cert_product` from the retrieved PaymentIntent,
 * and that the record call is addressed to that product's scoped plugin path.
 */

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_SECRET_KEY: "sk_test_x",
    WP_INTERNAL_SECRET: "shh",
    STRIPE_WEBHOOK_SECRET: "",
  },
  getServerWpJsonBase: () => "https://wp.test/wp-json",
}));

const { POST: intentPOST } = await import("@/app/api/certificate/intent/route");
const { POST: confirmPOST } = await import("@/app/api/certificate/confirm/route");

/** Captures every outbound fetch so assertions can read URLs and bodies. */
type Call = { url: string; body: Record<string, unknown> };
let calls: Call[];

function jsonReq(body: unknown): Request {
  return new Request("https://x.test/api/certificate/x", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function record(url: string, init?: RequestInit): Call {
  const raw = typeof init?.body === "string" ? init.body : "";
  let body: Record<string, unknown> = {};
  if (raw.startsWith("{")) {
    body = JSON.parse(raw) as Record<string, unknown>;
  } else if (raw) {
    body = Object.fromEntries(new URLSearchParams(raw));
  }
  return { url, body };
}

beforeEach(() => {
  calls = [];
});
afterEach(() => vi.unstubAllGlobals());

describe("POST /api/certificate/intent", () => {
  function stubFetch(quoteOk = true) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push(record(url, init));
        if (url.includes("/quote")) {
          return new Response(
            JSON.stringify({
              success: true,
              data: { available: quoteOk, currency: "GBP", total: 22.98, total_minor: 2298 },
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ id: "pi_1", client_secret: "cs_1" }), { status: 200 });
      }),
    );
  }

  const quoteCall = () => calls.find((c) => c.url.includes("/quote"));
  const stripeCall = () => calls.find((c) => c.url.includes("api.stripe.com"));

  it("prices against the product's scoped path and stamps it into PI metadata", async () => {
    stubFetch();
    const res = await intentPOST(
      jsonReq({
        product: "hardcopy",
        products: { "69": { choice: "CPD Accredited Certificate for £14.99", qty: 1 } },
        shipping: "UK Delivery for £2.99",
        contact: { email: "a@b.test", name: "A B" },
        fields: {},
      }),
    );

    expect(res.status).toBe(200);
    expect(quoteCall()?.url).toContain("/certificate/hardcopy/quote");
    // Scoping is the path segment; the plugin's documented body has no product key.
    expect(quoteCall()?.body.product).toBeUndefined();

    expect(stripeCall()?.body["metadata[cert_product]"]).toBe("hardcopy");
    expect(stripeCall()?.body.amount).toBe("2298");
  });

  it("defaults an omitted product to the unscoped alias", async () => {
    stubFetch();
    await intentPOST(jsonReq({ products: {}, contact: { email: "a@b.test" }, fields: {} }));

    expect(quoteCall()?.url).toMatch(/\/certificate\/quote$/);
    expect(stripeCall()?.body["metadata[cert_product]"]).toBe("default");
  });

  it("rejects an unknown product with 400 before pricing anything", async () => {
    stubFetch();
    const res = await intentPOST(
      jsonReq({ product: "22", products: {}, contact: { email: "a@b.test" } }),
    );
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("rejects the old `certificate` slug — the default is named `default`", async () => {
    stubFetch();
    const res = await intentPOST(
      jsonReq({ product: "certificate", products: {}, contact: { email: "a@b.test" } }),
    );
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });
});

describe("POST /api/certificate/confirm", () => {
  function stubFetch(piMetadata: Record<string, string>) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push(record(url, init));
        if (url.includes("api.stripe.com")) {
          return new Response(
            JSON.stringify({
              id: "pi_1",
              status: "succeeded",
              amount: 2298,
              currency: "gbp",
              metadata: piMetadata,
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ success: true, data: { ok: true } }), { status: 200 });
      }),
    );
  }

  const recordCall = () => calls.find((c) => c.url.includes("/record"));

  it("records against the scoped path for the product stamped on the PaymentIntent", async () => {
    stubFetch({ cert_product: "hardcopy", cert_email: "a@b.test" });
    await confirmPOST(jsonReq({ payment_intent_id: "pi_1" }));
    expect(recordCall()?.url).toContain("/certificate/hardcopy/record");
  });

  it("forwards the PI metadata, which the plugin treats as authoritative", async () => {
    // The plugin re-reads `cert_product` out of this metadata and prefers it over
    // the path, so the two can never disagree about which form to write into.
    stubFetch({ cert_product: "hardcopy", cert_email: "a@b.test" });
    await confirmPOST(jsonReq({ payment_intent_id: "pi_1" }));
    expect((recordCall()?.body.metadata as Record<string, string>).cert_product).toBe("hardcopy");
  });

  it("ignores a product supplied in the request body", async () => {
    // A forged body must not be able to redirect a hardcopy order onto form 23.
    stubFetch({ cert_product: "hardcopy" });
    await confirmPOST(jsonReq({ payment_intent_id: "pi_1", product: "default" }));
    expect(recordCall()?.url).toContain("/certificate/hardcopy/record");
  });

  it("uses the unscoped alias when the PI predates product stamping", async () => {
    stubFetch({ cert_email: "a@b.test" });
    await confirmPOST(jsonReq({ payment_intent_id: "pi_1" }));
    expect(recordCall()?.url).toMatch(/\/certificate\/record$/);
  });

  it("ignores an unrecognised product on the PI rather than forwarding it", async () => {
    stubFetch({ cert_product: "bogus" });
    await confirmPOST(jsonReq({ payment_intent_id: "pi_1" }));
    expect(recordCall()?.url).toMatch(/\/certificate\/record$/);
  });
});
