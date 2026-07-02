import { describe, it, expect, beforeEach } from "vitest";
import { normalizeWCCart, useCartStore } from "@/lib/stores/cart.store";
import type { WCStoreCart } from "@/lib/stores/cart.store";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeWCItem(
  overrides: Partial<WCStoreCart["items"][number]> = {},
): WCStoreCart["items"][number] {
  return {
    key: "key-1",
    id: 101,
    quantity: 1,
    name: "Test Course",
    sold_individually: true,
    quantity_limits: { minimum: 1, maximum: 1, multiple_of: 1, editable: false },
    images: [{ src: "https://example.com/img.jpg", thumbnail: "https://example.com/thumb.jpg" }],
    prices: { price: "1499", regular_price: "7900", currency_code: "GBP", currency_minor_unit: 2 },
    totals: { line_total: "1499", line_total_tax: "249", currency_minor_unit: 2 },
    ...overrides,
  };
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

// ─── normalizeWCCart ──────────────────────────────────────────────────────────

describe("normalizeWCCart()", () => {
  it("returns empty cart for WC response with no items", () => {
    const result = normalizeWCCart(makeWCCart());
    expect(result.items).toHaveLength(0);
    expect(result.item_count).toBe(0);
    expect(result.subtotal).toBe(14.99);
    expect(result.total).toBe(14.99);
  });

  it("converts pence (minor units) to pounds", () => {
    const cart = makeWCCart({ items: [makeWCItem()], items_count: 1 });
    const result = normalizeWCCart(cart);
    expect(result.items[0].price).toBe(14.99);
    expect(result.items[0].regular_price).toBe(79.0);
    expect(result.items[0].line_total).toBe(14.99);
  });

  it("reads VAT rate from tax_lines (authoritative)", () => {
    const result = normalizeWCCart(makeWCCart());
    expect(result.vat_rate).toBe(20);
  });

  it("falls back to ratio calculation when tax_lines is empty", () => {
    const cart = makeWCCart();
    cart.totals.tax_lines = [];
    // total_items=1499, total_items_tax=249 → 249/1499*100 ≈ 16.6
    const result = normalizeWCCart(cart);
    expect(result.vat_rate).toBeCloseTo(16.6, 0);
  });

  it("extracts coupon_code from first coupon", () => {
    const cart = makeWCCart({
      coupons: [{ code: "SAVE10" }],
      totals: {
        ...makeWCCart().totals,
        total_discount: "500",
      },
    });
    const result = normalizeWCCart(cart);
    expect(result.coupon_code).toBe("SAVE10");
    expect(result.discount).toBe(5.0);
  });

  it("normalises fee lines", () => {
    const cart = makeWCCart({
      fees: [
        {
          key: "fee-1",
          name: "Discount (PROMO)",
          totals: { total: "-500", total_tax: "0", currency_minor_unit: 2 },
        },
      ],
    });
    const result = normalizeWCCart(cart);
    expect(result.fees).toHaveLength(1);
    expect(result.fees[0].amount).toBe(-5.0);
    expect(result.fees[0].name).toBe("Discount (PROMO)");
  });

  it("decodes HTML entities in item names", () => {
    const cart = makeWCCart({
      items: [makeWCItem({ name: "Health &amp; Safety" })],
      items_count: 1,
    });
    const result = normalizeWCCart(cart);
    expect(result.items[0].name).toBe("Health & Safety");
  });

  it("carries cart-level errors through (out of stock, quantity exceeded, …)", () => {
    const cart = makeWCCart({
      errors: [
        {
          code: "woocommerce_rest_product_out_of_stock",
          message: "Sorry, &quot;X&quot; is out of stock.",
        },
        { message: "This item was removed." },
      ],
    });
    const result = normalizeWCCart(cart);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].code).toBe("woocommerce_rest_product_out_of_stock");
    expect(result.errors[0].message).toBe('Sorry, "X" is out of stock.'); // entity decoded
    expect(result.errors[1].code).toBe("cart_error"); // defaulted
  });

  it("defaults errors to an empty array when WC omits the field", () => {
    expect(normalizeWCCart(makeWCCart()).errors).toEqual([]);
  });
});

// ─── Store actions ────────────────────────────────────────────────────────────

describe("useCartStore actions", () => {
  const INITIAL_ITEMS = [
    {
      key: "key-1",
      product_id: 101,
      name: "Course A",
      thumbnail: "",
      price: 14.99,
      regular_price: 79.0,
      quantity: 2,
      line_total: 29.98,
      sold_individually: false,
      max_quantity: 99,
    },
    {
      key: "key-2",
      product_id: 202,
      name: "Course B",
      thumbnail: "",
      price: 9.99,
      regular_price: 49.0,
      quantity: 1,
      line_total: 9.99,
      sold_individually: true,
      max_quantity: 1,
    },
  ];

  beforeEach(() => {
    useCartStore.setState({
      items: INITIAL_ITEMS,
      itemCount: 3,
      totals: null,
      isOpen: false,
      hasHydrated: true,
    });
  });

  it("optimisticRemove removes item and decrements count", () => {
    useCartStore.getState().optimisticRemove("key-1");
    const { items, itemCount } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].key).toBe("key-2");
    expect(itemCount).toBe(1);
  });

  it("optimisticRemove is a no-op for unknown key", () => {
    useCartStore.getState().optimisticRemove("key-unknown");
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("optimisticUpdateQty updates quantity and recalculates line_total", () => {
    useCartStore.getState().optimisticUpdateQty("key-1", 3);
    const item = useCartStore.getState().items.find((i) => i.key === "key-1");
    expect(item?.quantity).toBe(3);
    expect(item?.line_total).toBeCloseTo(44.97, 2);
  });

  it("clearCart resets to empty state", () => {
    useCartStore.getState().clearCart();
    const { items, itemCount, totals } = useCartStore.getState();
    expect(items).toHaveLength(0);
    expect(itemCount).toBe(0);
    expect(totals).toBeNull();
  });

  it("setWCCart normalises and stores WC cart data", () => {
    const wcCart = makeWCCart({ items: [makeWCItem()], items_count: 1 });
    useCartStore.getState().setWCCart(wcCart);
    const { items, itemCount } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].price).toBe(14.99);
    expect(itemCount).toBe(1);
  });
});

// ─── Persistence shape (Phase 1: disk cache is the loop's disease) ──────────────

describe("useCartStore persistence", () => {
  function persistedState(): Record<string, unknown> | null {
    const raw = localStorage.getItem("lms-cart");
    if (!raw) return null;
    return (JSON.parse(raw) as { state?: Record<string, unknown> }).state ?? null;
  }

  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({ items: [], itemCount: 0, totals: null });
  });

  it("persists ONLY itemCount — never items/totals (server-owned, must not cache to disk)", () => {
    useCartStore.getState().setWCCart(makeWCCart({ items: [makeWCItem()], items_count: 1 }));

    const state = persistedState();
    expect(state).not.toBeNull();
    expect(state).toHaveProperty("itemCount", 1);
    // A stale disk snapshot of items/totals is what fought the server value and
    // drove the old update loop. It must never be persisted.
    expect(state).not.toHaveProperty("items");
    expect(state).not.toHaveProperty("totals");
  });

  it("keeps items/totals live in memory for the UI", () => {
    useCartStore.getState().setWCCart(makeWCCart({ items: [makeWCItem()], items_count: 1 }));

    const live = useCartStore.getState();
    expect(live.items).toHaveLength(1);
    expect(live.totals).not.toBeNull();
    expect(live.itemCount).toBe(1);
  });
});
