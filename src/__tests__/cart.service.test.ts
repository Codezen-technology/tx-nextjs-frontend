import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cartService } from "@/lib/services/cart";
import type { WCStoreCart } from "@/lib/stores/cart.store";

// ─── Fetch mock helpers ───────────────────────────────────────────────────────

const fetchMock = vi.fn();

function res(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    text: () => Promise.resolve(status === 204 ? "" : JSON.stringify(data)),
  });
}

function makeWCCart(overrides: Partial<WCStoreCart> = {}): WCStoreCart {
  return {
    items: [],
    coupons: [],
    fees: [],
    items_count: 0,
    totals: {
      total_items: "1499",
      total_items_tax: "249",
      total_fees: "0",
      total_fees_tax: "0",
      total_discount: "0",
      total_tax: "249",
      total_price: "1499",
      currency_code: "GBP",
      currency_minor_unit: 2,
      currency_symbol: "£",
      tax_lines: [{ name: "VAT", price: "249", rate: "20" }],
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  // Pre-seed cart token so cartFetch skips bootstrap GET
  localStorage.setItem("wc-cart-token", "tok_test");
  localStorage.setItem("wc-cart-nonce", "nonce_test");
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

// ─── addItem ──────────────────────────────────────────────────────────────────

describe("cartService.addItem()", () => {
  it("POSTs to /api/cart/items and returns normalised cart", async () => {
    fetchMock.mockResolvedValueOnce(res(makeWCCart({ items_count: 1 })));

    const cart = await cartService.addItem(42, 1);
    expect(cart.item_count).toBe(1);
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toBe("/api/cart/items");
    expect(call[1]).toMatchObject({ method: "POST" });
    expect(JSON.parse(call[1].body as string)).toEqual({ product_id: 42, quantity: 1 });
  });

  it("throws ApiError on server error", async () => {
    fetchMock.mockResolvedValueOnce(res({ code: "cart_error", message: "Out of stock" }, 400));
    await expect(cartService.addItem(99, 1)).rejects.toThrow("Out of stock");
  });
});

// ─── updateItem ───────────────────────────────────────────────────────────────

describe("cartService.updateItem()", () => {
  it("PUTs to /api/cart/items/{key} and returns normalised cart", async () => {
    fetchMock.mockResolvedValueOnce(res(makeWCCart()));

    await cartService.updateItem("key-abc", 3);
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toContain("key-abc");
    expect(call[1]).toMatchObject({ method: "PUT" });
    expect(JSON.parse(call[1].body as string)).toEqual({ quantity: 3 });
  });

  it("syncs to embedded cart on woocommerce_rest_cart_invalid_key error", async () => {
    const embeddedCart = makeWCCart({ items_count: 2 });
    fetchMock.mockResolvedValueOnce(
      res({ code: "woocommerce_rest_cart_invalid_key", data: { cart: embeddedCart } }, 409),
    );

    const cart = await cartService.updateItem("stale-key", 1);
    // cartFetch uses the embedded cart; items_count preserved
    expect(cart.item_count).toBe(2);
  });
});

// ─── removeItem ───────────────────────────────────────────────────────────────

describe("cartService.removeItem()", () => {
  it("DELETEs item then GETs cart — regression: WC returns 204 No Content", async () => {
    fetchMock
      .mockResolvedValueOnce(res(null, 204)) // DELETE → 204
      .mockResolvedValueOnce(res(makeWCCart())); // GET /api/cart

    const cart = await cartService.removeItem("key-1");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
    expect(fetchMock.mock.calls[1][0]).toBe("/api/cart");
    expect(cart).toBeDefined();
  });

  it("throws when DELETE fails with server error", async () => {
    fetchMock.mockResolvedValueOnce(res({ message: "Not found" }, 404));
    await expect(cartService.removeItem("bad-key")).rejects.toThrow();
  });

  it("re-fetches fresh cart even when WC returns cart body on DELETE", async () => {
    fetchMock
      .mockResolvedValueOnce(res(makeWCCart({ items_count: 0 }))) // DELETE with body
      .mockResolvedValueOnce(res(makeWCCart({ items_count: 0 }))); // GET re-fetch

    await cartService.removeItem("key-1");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

// ─── emptyCart ────────────────────────────────────────────────────────────────

describe("cartService.emptyCart()", () => {
  it("DELETEs /api/cart (204) then GETs fresh cart", async () => {
    fetchMock.mockResolvedValueOnce(res(null, 204)).mockResolvedValueOnce(res(makeWCCart()));

    await cartService.emptyCart();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/cart");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
  });
});

// ─── applyCoupon ──────────────────────────────────────────────────────────────

describe("cartService.applyCoupon()", () => {
  it("POSTs coupon code and returns normalised cart with discount", async () => {
    const cartWithCoupon = makeWCCart({
      coupons: [{ code: "SAVE10" }],
      totals: {
        ...makeWCCart().totals,
        total_discount: "500",
      },
    });
    fetchMock.mockResolvedValueOnce(res(cartWithCoupon));

    const cart = await cartService.applyCoupon("SAVE10");
    expect(cart.coupon_code).toBe("SAVE10");
    expect(cart.discount).toBe(5.0);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ code: "SAVE10" });
  });

  it("throws when coupon is invalid", async () => {
    fetchMock.mockResolvedValueOnce(res({ message: "Coupon does not exist" }, 400));
    await expect(cartService.applyCoupon("INVALID")).rejects.toThrow("Coupon does not exist");
  });
});

// ─── removeCoupon ─────────────────────────────────────────────────────────────

describe("cartService.removeCoupon()", () => {
  it("DELETEs coupon (204) then GETs cart without discount", async () => {
    fetchMock.mockResolvedValueOnce(res(null, 204)).mockResolvedValueOnce(res(makeWCCart()));

    const cart = await cartService.removeCoupon("SAVE10");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("SAVE10");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
    expect(cart.coupon_code).toBeNull();
    expect(cart.discount).toBe(0);
  });
});
