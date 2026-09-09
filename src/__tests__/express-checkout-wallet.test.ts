import { describe, it, expect } from "vitest";
import { walletBillingAddress, stripeCardPaymentData } from "@/lib/services/checkout";
import { normalizeWCCart, type WCStoreCart } from "@/lib/stores/cart.store";

/**
 * Express checkout (Apple Pay / Google Pay) has no billing form of its own: the
 * wallet sheet is the only place the buyer supplies an address, and the cart is
 * the only place the currency comes from. Both were dropped on the way to
 * Stripe/WooCommerce in the first cut of this feature, so both are pinned here.
 */
describe("wallet billing address", () => {
  const address = {
    line1: "12 Fake Street",
    line2: "Flat 3",
    city: "Manchester",
    state: "Greater Manchester",
    postal_code: "M1 2AB",
    country: "GB",
  };

  it("maps every wallet field onto the WC Store API address", () => {
    expect(
      walletBillingAddress({
        name: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+447700900000",
        address,
      }),
    ).toEqual({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
      phone: "+447700900000",
      address_1: "12 Fake Street",
      address_2: "Flat 3",
      city: "Manchester",
      state: "Greater Manchester",
      postcode: "M1 2AB",
      country: "GB",
    });
  });

  it("keeps every name token after the first as the surname", () => {
    const mapped = walletBillingAddress({ name: "Ada King  Lovelace", address });
    expect(mapped.first_name).toBe("Ada");
    expect(mapped.last_name).toBe("King Lovelace");
  });

  it("leaves the surname empty for a single-token name", () => {
    expect(walletBillingAddress({ name: "Prince", address }).last_name).toBe("");
  });

  it("falls back to the store country when the wallet returns none", () => {
    const mapped = walletBillingAddress({ name: "Ada Lovelace" });
    expect(mapped.country).toBe("GB");
    expect(mapped.address_1).toBe("");
    expect(mapped.postcode).toBe("");
  });

  it("omits optional fields rather than sending empty strings", () => {
    const mapped = walletBillingAddress({
      name: "Ada Lovelace",
      address: { ...address, line2: null },
    });
    expect(mapped).not.toHaveProperty("address_2");
    expect(mapped).not.toHaveProperty("phone");
  });

  it("survives a wallet that returns nothing at all", () => {
    expect(() => walletBillingAddress(undefined)).not.toThrow();
    expect(walletBillingAddress(undefined).country).toBe("GB");
  });
});

describe("wallet payment_data", () => {
  it("sends the wallet PaymentMethod under the key the WC Stripe gateway reads", () => {
    const data = stripeCardPaymentData("pm_wallet_123");
    expect(data).toContainEqual({ key: "wc-stripe-payment-method", value: "pm_wallet_123" });
    // Without this the gateway cannot derive a payment method type and the order fails.
    expect(data).toContainEqual({ key: "payment_method", value: "stripe" });
  });
});

describe("cart currency", () => {
  function wcCart(overrides: Partial<WCStoreCart["totals"]> = {}): WCStoreCart {
    return {
      items: [],
      coupons: [],
      fees: [],
      items_count: 1,
      totals: {
        total_items: "1499",
        total_items_tax: "0",
        total_fees: "0",
        total_fees_tax: "0",
        total_discount: "0",
        total_tax: "0",
        total_price: "1499",
        currency_code: "GBP",
        currency_minor_unit: 2,
        currency_symbol: "£",
        tax_lines: [],
        ...overrides,
      },
    };
  }

  it("exposes the ISO code separately from the display symbol", () => {
    const cart = normalizeWCCart(wcCart());
    // Stripe rejects "£" — paymentRequest/Elements need "gbp".
    expect(cart.currency).toBe("£");
    expect(cart.currency_code).toBe("GBP");
  });

  it("carries a non-GBP store currency through unchanged", () => {
    const cart = normalizeWCCart(wcCart({ currency_code: "EUR", currency_symbol: "€" }));
    expect(cart.currency_code).toBe("EUR");
  });

  it("falls back to GBP when WooCommerce omits the code", () => {
    expect(normalizeWCCart(wcCart({ currency_code: "" })).currency_code).toBe("GBP");
  });
});
