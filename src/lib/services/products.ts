import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { decodeEntities } from "@/lib/api/parsers";
import { toFrontendPath } from "@/lib/utils/url";
import type { Product, WCStorePrices, WCStoreProduct } from "@/types/product";

/** Convert a Store API minor-unit price string ("7900") to major units (79). */
function toMajor(amount: string | undefined, minorUnit: number): number {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  return n / 10 ** minorUnit;
}

/** Format a major-unit amount using the product's currency affixes. */
function formatPrice(prices: WCStorePrices, amount: number): string {
  const symbol = decodeEntities(prices.currency_symbol ?? "");
  const minor = prices.currency_minor_unit ?? 2;
  return `${prices.currency_prefix ?? ""}${symbol}${amount.toFixed(minor)}${prices.currency_suffix ?? ""}`;
}

export function normalizeProduct(raw: WCStoreProduct): Product {
  const prices = raw.prices ?? ({} as WCStorePrices);
  const minor = prices.currency_minor_unit ?? 2;
  const price = toMajor(prices.price, minor);
  const regularPrice = toMajor(prices.regular_price, minor);
  const salePrice = prices.sale_price ? toMajor(prices.sale_price, minor) : null;

  return {
    id: raw.id,
    slug: raw.slug,
    name: decodeEntities(raw.name ?? ""),
    permalink: toFrontendPath(raw.permalink),
    description: raw.description ?? "",
    shortDescription: raw.short_description ?? "",
    sku: raw.sku ?? "",
    onSale: !!raw.on_sale,
    price,
    regularPrice,
    salePrice,
    currencyCode: prices.currency_code ?? "GBP",
    currencySymbol: decodeEntities(prices.currency_symbol ?? ""),
    priceFormatted: formatPrice(prices, price),
    regularPriceFormatted: formatPrice(prices, regularPrice),
    image: raw.images?.[0] ?? null,
    images: raw.images ?? [],
    averageRating: Number(raw.average_rating) || 0,
    reviewCount: raw.review_count ?? 0,
    isInStock: raw.is_in_stock !== false,
    isPurchasable: raw.is_purchasable !== false,
    hasOptions: !!raw.has_options,
    addToCartText: decodeEntities(raw.add_to_cart?.text ?? "Add to cart"),
  };
}

/** Public, direct-to-WP read of the WooCommerce Store API products endpoint. */
export const productService = {
  async getBySlug(slug: string): Promise<Product | null> {
    const { data } = await api.get<WCStoreProduct[]>(
      `${endpoints.products.list}?slug=${encodeURIComponent(slug)}`,
    );
    const raw = Array.isArray(data) ? data[0] : null;
    return raw ? normalizeProduct(raw) : null;
  },
};
