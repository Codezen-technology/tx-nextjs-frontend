import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkoutService } from "@/lib/services/checkout";
import { useBuyNowStore } from "@/lib/stores/buy-now.store";

// ─── Fetch mock helpers ───────────────────────────────────────────────────────

const fetchMock = vi.fn();

function res(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

const BILLING = {
  first_name: "Jane",
  last_name: "Smith",
  address_1: "1 High Street",
  city: "London",
  postcode: "EC1A 1BB",
  country: "GB",
  email: "jane@example.com",
};

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  localStorage.setItem("wc-cart-token", "tok_test");
  localStorage.setItem("wc-cart-nonce", "nonce_test");
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

// ─── wcStoreCheckout ──────────────────────────────────────────────────────────

describe("checkoutService.wcStoreCheckout()", () => {
  it("POSTs to /api/cart/checkout with billing_address and payment_data", async () => {
    fetchMock.mockResolvedValueOnce(
      res({
        order_id: 1001,
        order_key: "wc_order_abc",
        status: "processing",
        payment_method: "stripe",
        payment_result: {
          payment_status: "success",
          payment_details: [],
          redirect_url: "",
        },
      }),
    );

    const result = await checkoutService.wcStoreCheckout({
      billing_address: BILLING,
      payment_method: "stripe",
      payment_data: [{ key: "stripe_payment_method", value: "pm_test_123" }],
    });

    expect(result.order_id).toBe(1001);
    expect(result.payment_result.payment_status).toBe("success");

    const call = fetchMock.mock.calls[0];
    expect(call[0]).toBe("/api/cart/checkout");
    expect(call[1]).toMatchObject({ method: "POST" });

    const body = JSON.parse(call[1].body as string);
    expect(body.billing_address).toMatchObject({ email: "jane@example.com" });
    expect(body.payment_data).toContainEqual({
      key: "stripe_payment_method",
      value: "pm_test_123",
    });
  });

  it("attaches Cart-Token header for session continuity", async () => {
    fetchMock.mockResolvedValueOnce(
      res({
        order_id: 1002,
        order_key: "wc_order_def",
        status: "processing",
        payment_method: "stripe",
        payment_result: { payment_status: "success", payment_details: [], redirect_url: "" },
      }),
    );

    await checkoutService.wcStoreCheckout({
      billing_address: BILLING,
      payment_method: "stripe",
    });

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers["x-cart-token"]).toBe("tok_test");
    expect(headers["x-wc-store-api-nonce"]).toBe("nonce_test");
  });

  it("returns requires_action response for 3DS challenge", async () => {
    fetchMock.mockResolvedValueOnce(
      res({
        order_id: 1003,
        order_key: "wc_order_ghi",
        status: "pending",
        payment_method: "stripe",
        payment_result: {
          payment_status: "requires_action",
          payment_details: [{ key: "client_secret", value: "pi_test_secret" }],
          redirect_url: "https://stripe.com/3ds",
        },
      }),
    );

    const result = await checkoutService.wcStoreCheckout({
      billing_address: BILLING,
      payment_method: "stripe",
      payment_data: [{ key: "stripe_payment_method", value: "pm_test_456" }],
    });

    expect(result.payment_result.payment_status).toBe("requires_action");
    expect(result.payment_result.payment_details).toContainEqual({
      key: "client_secret",
      value: "pi_test_secret",
    });
  });

  it("throws ApiError on WC checkout failure", async () => {
    fetchMock.mockResolvedValueOnce(
      res({ code: "woocommerce_rest_checkout_error", message: "Cart is empty" }, 400),
    );

    await expect(
      checkoutService.wcStoreCheckout({ billing_address: BILLING, payment_method: "stripe" }),
    ).rejects.toThrow("Cart is empty");
  });

  it("retries with stripe_payment_intent on 3DS confirm call", async () => {
    fetchMock.mockResolvedValueOnce(
      res({
        order_id: 1004,
        order_key: "wc_order_jkl",
        status: "processing",
        payment_method: "stripe",
        payment_result: { payment_status: "success", payment_details: [], redirect_url: "" },
      }),
    );

    await checkoutService.wcStoreCheckout({
      billing_address: BILLING,
      payment_method: "stripe",
      payment_data: [
        { key: "stripe_payment_method", value: "pm_test_789" },
        { key: "stripe_payment_intent", value: "pi_test_confirmed" },
      ],
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.payment_data).toContainEqual({
      key: "stripe_payment_intent",
      value: "pi_test_confirmed",
    });
  });
});

// ─── createOrder (Buy Now REST v3 path) ──────────────────────────────────────

describe("checkoutService.createOrder()", () => {
  it("POSTs to /api/orders with line_items and returns order with client_secret", async () => {
    fetchMock.mockResolvedValueOnce(
      res({
        order_id: 2001,
        order_key: "wc_order_buynow",
        status: "pending",
        total: 14.99,
        currency: "GBP",
        client_secret: "pi_test_buynow_secret",
        payment_intent_id: "pi_test_buynow",
      }),
    );

    const result = await checkoutService.createOrder({
      billing: BILLING,
      payment_method: "stripe",
      line_items: [{ product_id: 101, quantity: 1 }],
    });

    expect(result.order_id).toBe(2001);
    expect(result.client_secret).toBe("pi_test_buynow_secret");

    const call = fetchMock.mock.calls[0];
    expect(call[0]).toBe("/api/orders");
    expect(call[1]).toMatchObject({ method: "POST" });
  });

  it("throws when Stripe is not configured (503)", async () => {
    fetchMock.mockResolvedValueOnce(res({ error: "Stripe is not configured on the server" }, 503));

    await expect(
      checkoutService.createOrder({
        billing: BILLING,
        payment_method: "stripe",
        line_items: [{ product_id: 101, quantity: 1 }],
      }),
    ).rejects.toThrow("Stripe is not configured on the server");
  });
});

// ─── useBuyNowStore ───────────────────────────────────────────────────────────

describe("useBuyNowStore", () => {
  const TEST_ITEM = {
    product_id: 101,
    name: "Test Course",
    price: 14.99,
    quantity: 1,
    thumbnail: "https://example.com/thumb.jpg",
  };

  beforeEach(() => {
    useBuyNowStore.setState({ item: null, hasHydrated: false });
  });

  it("set() stores item in state", () => {
    useBuyNowStore.getState().set(TEST_ITEM);
    expect(useBuyNowStore.getState().item).toMatchObject(TEST_ITEM);
  });

  it("clear() removes item from state", () => {
    useBuyNowStore.setState({ item: TEST_ITEM });
    useBuyNowStore.getState().clear();
    expect(useBuyNowStore.getState().item).toBeNull();
  });

  it("hasHydrated starts false, set to true via setHasHydrated", () => {
    expect(useBuyNowStore.getState().hasHydrated).toBe(false);
    useBuyNowStore.getState().setHasHydrated(true);
    expect(useBuyNowStore.getState().hasHydrated).toBe(true);
  });

  it("persists item to sessionStorage", () => {
    useBuyNowStore.getState().set(TEST_ITEM);
    const stored = sessionStorage.getItem("lms-buy-now");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.state.item).toMatchObject({ product_id: 101 });
  });

  it("clear() removes item from sessionStorage", () => {
    useBuyNowStore.getState().set(TEST_ITEM);
    useBuyNowStore.getState().clear();
    const stored = sessionStorage.getItem("lms-buy-now");
    const parsed = JSON.parse(stored!);
    expect(parsed.state.item).toBeNull();
  });
});
