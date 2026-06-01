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

export interface Cart extends CartTotals {
  items: CartItem[];
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
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface CartStore {
  items: CartItem[];
  totals: CartTotals | null;
  itemCount: number;
  isOpen: boolean;
  hasHydrated: boolean;
  setCart: (cart: Cart) => void;
  setWCCart: (wc: WCStoreCart) => void;
  optimisticRemove: (key: string) => void;
  optimisticUpdateQty: (key: string, qty: number) => void;
  toggleCart: () => void;
  clearCart: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totals: null,
      itemCount: 0,
      isOpen: false,
      hasHydrated: false,

      setCart: (cart) =>
        set({
          items: cart.items,
          itemCount: cart.item_count,
          totals: {
            subtotal: cart.subtotal,
            vat_rate: cart.vat_rate,
            vat_amount: cart.vat_amount,
            discount: cart.discount,
            fees: cart.fees,
            total: cart.total,
            coupon_code: cart.coupon_code,
            item_count: cart.item_count,
            currency: cart.currency,
          },
        }),

      setWCCart: (wc) => {
        const cart = normalizeWCCart(wc);
        set({
          items: cart.items,
          itemCount: cart.item_count,
          totals: {
            subtotal: cart.subtotal,
            vat_rate: cart.vat_rate,
            vat_amount: cart.vat_amount,
            discount: cart.discount,
            fees: cart.fees,
            total: cart.total,
            coupon_code: cart.coupon_code,
            item_count: cart.item_count,
            currency: cart.currency,
          },
        });
      },

      optimisticRemove: (key) => {
        const items = get().items.filter((i) => i.key !== key);
        set({ items, itemCount: items.reduce((s, i) => s + i.quantity, 0) });
      },

      optimisticUpdateQty: (key, qty) => {
        const items = get().items.map((i) =>
          i.key === key ? { ...i, quantity: qty, line_total: i.price * qty } : i,
        );
        set({ items, itemCount: items.reduce((s, i) => s + i.quantity, 0) });
      },

      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      clearCart: () => set({ items: [], totals: null, itemCount: 0 }),

      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "lms-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        itemCount: state.itemCount,
        totals: state.totals,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
