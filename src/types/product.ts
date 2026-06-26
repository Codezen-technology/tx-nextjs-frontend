/**
 * WooCommerce Store API product types.
 *
 * Source: https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/products/
 * The Store API (`/wc/store/v1/products`) is a public, unauthenticated read.
 * Prices arrive as integer strings in the currency's MINOR unit (e.g. "7900" for
 * £79.00 with `currency_minor_unit: 2`) — the service converts them to major units.
 */

export interface WCStorePrices {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_prefix: string;
  currency_suffix: string;
}

export interface WCStoreImage {
  id: number;
  src: string;
  thumbnail: string;
  srcset: string;
  sizes: string;
  name: string;
  alt: string;
}

/** Subset of the Store API product object that the frontend consumes. */
export interface WCStoreProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: string;
  sku: string;
  description: string;
  short_description: string;
  on_sale: boolean;
  prices: WCStorePrices;
  price_html: string;
  average_rating: string;
  review_count: number;
  images: WCStoreImage[];
  is_in_stock: boolean;
  is_purchasable: boolean;
  has_options: boolean;
  add_to_cart: { text: string; description: string };
}

/** Normalised, frontend-friendly product (major-unit prices, decoded entities). */
export interface Product {
  id: number;
  slug: string;
  name: string;
  /** Frontend-relative permalink (rewritten off the WP backend origin). */
  permalink: string;
  /** Raw HTML — render with dangerouslySetInnerHTML. */
  description: string;
  shortDescription: string;
  sku: string;
  onSale: boolean;
  price: number;
  regularPrice: number;
  salePrice: number | null;
  currencyCode: string;
  currencySymbol: string;
  priceFormatted: string;
  regularPriceFormatted: string;
  image: WCStoreImage | null;
  images: WCStoreImage[];
  averageRating: number;
  reviewCount: number;
  isInStock: boolean;
  isPurchasable: boolean;
  /** Variable product — cannot be added straight to cart from a simple page. */
  hasOptions: boolean;
  addToCartText: string;
}
