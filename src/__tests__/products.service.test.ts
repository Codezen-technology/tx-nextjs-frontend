import { describe, it, expect } from "vitest";
import { normalizeProduct } from "@/lib/services/products";
import type { WCStoreProduct } from "@/types/product";

// vitest.config.ts sets NEXT_PUBLIC_WP_API_URL=http://localhost, so the WP backend
// origin used by toFrontendPath is http://localhost.
function makeRaw(overrides: Partial<WCStoreProduct> = {}): WCStoreProduct {
  return {
    id: 10,
    name: "Premium Access",
    slug: "premium-access",
    permalink: "http://localhost/product/premium-access/",
    type: "simple",
    sku: "PA-1",
    description: "<p>Full</p>",
    short_description: "<p>Short</p>",
    on_sale: false,
    prices: {
      price: "7900",
      regular_price: "9900",
      sale_price: "",
      currency_code: "GBP",
      currency_symbol: "£",
      currency_minor_unit: 2,
      currency_prefix: "",
      currency_suffix: "",
    },
    price_html: "",
    average_rating: "4.5",
    review_count: 12,
    images: [
      {
        id: 1,
        src: "http://localhost/img.jpg",
        thumbnail: "",
        srcset: "",
        sizes: "",
        name: "",
        alt: "Alt",
      },
    ],
    is_in_stock: true,
    is_purchasable: true,
    has_options: false,
    add_to_cart: { text: "Add to cart", description: "" },
    ...overrides,
  };
}

describe("normalizeProduct", () => {
  it("converts minor-unit prices to major units", () => {
    const p = normalizeProduct(makeRaw());
    expect(p.price).toBe(79);
    expect(p.regularPrice).toBe(99);
  });

  it("formats price with the currency symbol and minor-unit precision", () => {
    const p = normalizeProduct(makeRaw());
    expect(p.currencySymbol).toBe("£");
    expect(p.priceFormatted).toBe("£79.00");
    expect(p.regularPriceFormatted).toBe("£99.00");
  });

  it("decodes a numeric-entity currency symbol", () => {
    const p = normalizeProduct(
      makeRaw({ prices: { ...makeRaw().prices, currency_symbol: "&#163;" } }),
    );
    expect(p.priceFormatted).toBe("£79.00");
  });

  it("rewrites permalink to a frontend-relative path", () => {
    expect(normalizeProduct(makeRaw()).permalink).toBe("/product/premium-access/");
  });

  it("parses sale price only when present", () => {
    expect(normalizeProduct(makeRaw()).salePrice).toBeNull();
    const onSale = normalizeProduct(
      makeRaw({ on_sale: true, prices: { ...makeRaw().prices, sale_price: "5900" } }),
    );
    expect(onSale.salePrice).toBe(59);
    expect(onSale.onSale).toBe(true);
  });

  it("decodes HTML entities in the name and parses rating", () => {
    const p = normalizeProduct(makeRaw({ name: "Premium &amp; Pro", average_rating: "4.5" }));
    expect(p.name).toBe("Premium & Pro");
    expect(p.averageRating).toBe(4.5);
    expect(p.reviewCount).toBe(12);
  });

  it("flags non-purchasable / variable products", () => {
    const p = normalizeProduct(makeRaw({ is_purchasable: false, has_options: true }));
    expect(p.isPurchasable).toBe(false);
    expect(p.hasOptions).toBe(true);
  });
});
