"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { decodeEntities } from "@/lib/api/parsers";

// ─── Domain types (internal) ──────────────────────────────────────────────────

export interface CartItem {
  key: string;
  product_id: number;
  name: string;
  thumbnail: string;
  price: number;
  regular_price: number;
  quantity: number;
  line_total: number;
  sold_individually: boolean;
  max_quantity: number;
  /** WC `quantity_limits.editable` — false when the qty stepper must be hidden. */
  editable: boolean;
}

export interface CartFee {
  key: string;
  name: string;
  amount: number;
}

export interface CartTotals {
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  discount: number;
  fees: CartFee[];
  total: number;
  coupon_code: string | null;
  item_count: number;
  currency: string;
}

/** Customer billing/shipping returned by the WC Store API (logged-in customers). */
export interface CartAddress {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

/**
 * Cart-level problem surfaced by the WC Store API (out of stock, quantity
 * exceeded, item auto-removed, coupon no longer valid, etc). Comes from the
 * response's top-level `errors` array — distinct from a failed HTTP request.
 */
export interface CartError {
  code: string;
  message: string;
}

export interface Cart extends CartTotals {
  items: CartItem[];
  /** Saved billing address for the logged-in customer; empty strings for guests. */
  billingAddress?: CartAddress;
  /** Cart-level validation errors from WC (empty when the cart is clean). */
  errors: CartError[];
}

// ─── WC Store API raw types ───────────────────────────────────────────────────

interface WCStoreCartItem {
  key: string;
  id: number;
  quantity: number;
  name: string;
  sold_individually: boolean;
  quantity_limits: {
    minimum: number;
    maximum: number;
    multiple_of: number;
    editable: boolean;
  };
  images?: Array<{ src: string; thumbnail?: string }>;
  prices: {
    price: string;
    regular_price: string;
    currency_code: string;
    currency_minor_unit: number;
  };
  totals: {
    line_total: string;
    line_total_tax: string;
    currency_minor_unit: number;
  };
}

interface WCStoreFee {
  key: string;
  name: string;
  totals: {
    total: string;
    total_tax: string;
    currency_minor_unit: number;
  };
}

export interface WCStoreCart {
  items: WCStoreCartItem[];
  coupons: Array<{ code: string; totals?: { total_discount?: string } }>;
  fees: WCStoreFee[];
  totals: {
    total_items: string;
    total_items_tax: string;
    total_fees: string;
    total_fees_tax: string;
    total_discount: string;
    total_tax: string;
    total_price: string;
    currency_code: string;
    currency_minor_unit: number;
    currency_symbol: string;
    tax_lines: Array<{ name: string; price: string; rate: string }>;
  };
  items_count: number;
  billing_address?: CartAddress;
  shipping_address?: CartAddress;
  errors?: Array<{ code?: string; message?: string }>;
}

// ─── Normalization ────────────────────────────────────────────────────────────

export function normalizeWCCart(wc: WCStoreCart): Cart {
  const minorUnit = wc.totals.currency_minor_unit ?? 2;
  const div = Math.pow(10, minorUnit);

  const totalItemsRaw = parseInt(wc.totals.total_items, 10);
  const totalItemsTaxRaw = parseInt(wc.totals.total_items_tax, 10);
  // total_tax is net of fee tax adjustments — the amount the customer actually pays
  const totalTaxRaw = parseInt(wc.totals.total_tax, 10);

  // Prefer WC's authoritative tax rate from tax_lines; fall back to ratio calculation
  // rounded to 1dp to avoid integer-division artifacts (e.g. 1199/2498*100 = 20.016%)
  const taxLine = wc.totals.tax_lines?.[0];
  const vatRate = taxLine
    ? parseFloat(taxLine.rate)
    : parseFloat((totalItemsRaw > 0 ? (totalItemsTaxRaw / totalItemsRaw) * 100 : 0).toFixed(1));

  const items: CartItem[] = wc.items.map((item) => {
    const priceDiv = Math.pow(10, item.prices.currency_minor_unit ?? minorUnit);
    const totalsDiv = Math.pow(10, item.totals.currency_minor_unit ?? minorUnit);
    return {
      key: item.key,
      product_id: item.id,
      name: decodeEntities(item.name),
      thumbnail: item.images?.[0]?.thumbnail ?? item.images?.[0]?.src ?? "",
      price: parseInt(item.prices.price, 10) / priceDiv,
      regular_price: parseInt(item.prices.regular_price, 10) / priceDiv,
      quantity: item.quantity,
      line_total: parseInt(item.totals.line_total, 10) / totalsDiv,
      sold_individually: item.sold_individually ?? false,
      max_quantity: item.quantity_limits?.maximum ?? 9999,
      // Default true — a normal simple product is editable; only hide the stepper
      // when WC explicitly says so (sold-individually, fixed-qty, stock-capped).
      editable: item.quantity_limits?.editable ?? true,
    };
  });

  const fees: CartFee[] = (wc.fees ?? []).map((fee) => {
    const feeDiv = Math.pow(10, fee.totals.currency_minor_unit ?? minorUnit);
    return {
      key: fee.key,
      name: decodeEntities(fee.name),
      amount: parseInt(fee.totals.total, 10) / feeDiv,
    };
  });

  return {
    items,
    subtotal: totalItemsRaw / div,
    vat_rate: vatRate,
    vat_amount: totalTaxRaw / div,
    discount: parseInt(wc.totals.total_discount, 10) / div,
    fees,
    total: parseInt(wc.totals.total_price, 10) / div,
    coupon_code: wc.coupons?.[0]?.code ?? null,
    item_count: wc.items_count,
    currency: decodeEntities(wc.totals.currency_symbol),
    billingAddress: wc.billing_address,
    errors: (wc.errors ?? [])
      .filter((e) => e?.message)
      .map((e) => ({ code: e.code ?? "cart_error", message: decodeEntities(e.message ?? "") })),
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * UI-only cart store. Cart DATA (items/totals) is owned entirely by TanStack
 * Query (`useCartQuery`) — the store keeps only view state that must survive a
 * reload or live outside React's data layer:
 *
 * - `itemCount` — persisted so the header badge renders a number before the cart
 *   query resolves. Fed from the query by the header (`setItemCount`); a scalar,
 *   never the cart, so it can't diverge from server truth the way a cached
 *   `items`/`totals` snapshot did (that snapshot drove the old update loop).
 * - `isOpen` / `toggleCart` — mini-cart open state.
 * - `hasHydrated` — gates the badge until localStorage rehydrates (SSR-safe).
 */
interface CartStore {
  itemCount: number;
  isOpen: boolean;
  hasHydrated: boolean;
  setItemCount: (n: number) => void;
  toggleCart: () => void;
  clearCart: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      itemCount: 0,
      isOpen: false,
      hasHydrated: false,

      // No-op when unchanged so the header's per-render sync can't spam subscribers.
      setItemCount: (n) => set((s) => (s.itemCount === n ? s : { itemCount: n })),

      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      clearCart: () => set({ itemCount: 0 }),

      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "lms-cart",
      storage: createJSONStorage(() => localStorage),
      // Persist ONLY itemCount — just enough for the header badge to render a
      // number before the cart query hydrates. `items`/`totals` are server-owned
      // and live solely in TanStack Query: a stale persisted snapshot is what
      // hydrated a wrong quantity and fought the server value, driving the old
      // update loop. useCartQuery is the sole source of truth for cart data.
      partialize: (state) => ({
        itemCount: state.itemCount,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
