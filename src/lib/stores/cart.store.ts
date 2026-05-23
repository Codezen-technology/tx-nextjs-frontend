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
  quantity: number;
  line_total: number;
}

export interface CartTotals {
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  discount: number;
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
  images?: Array<{ src: string }>;
  prices: {
    price: string;
    currency_code: string;
    currency_minor_unit: number;
  };
  totals: {
    line_total: string;
    line_total_tax: string;
  };
}

export interface WCStoreCart {
  items: WCStoreCartItem[];
  coupons: Array<{ code: string; totals?: { total_discount?: string } }>;
  totals: {
    total_items: string;
    total_items_tax: string;
    total_discount: string;
    total_tax: string;
    total_price: string;
    currency_code: string;
    currency_minor_unit: number;
  };
  items_count: number;
}

// ─── Normalization ────────────────────────────────────────────────────────────

export function normalizeWCCart(wc: WCStoreCart): Cart {
  const minorUnit = wc.totals.currency_minor_unit ?? 2;
  const div = Math.pow(10, minorUnit);

  const totalItemsRaw = parseInt(wc.totals.total_items, 10);
  const totalTaxRaw = parseInt(wc.totals.total_items_tax, 10);

  const items: CartItem[] = wc.items.map((item) => ({
    key: item.key,
    product_id: item.id,
    name: decodeEntities(item.name),
    thumbnail: item.images?.[0]?.src ?? "",
    price: parseInt(item.prices.price, 10) / div,
    quantity: item.quantity,
    line_total: parseInt(item.totals.line_total, 10) / div,
  }));

  return {
    items,
    subtotal: totalItemsRaw / div,
    vat_rate: totalItemsRaw > 0 ? (totalTaxRaw / totalItemsRaw) * 100 : 0,
    vat_amount: totalTaxRaw / div,
    discount: parseInt(wc.totals.total_discount, 10) / div,
    total: parseInt(wc.totals.total_price, 10) / div,
    coupon_code: wc.coupons?.[0]?.code ?? null,
    item_count: wc.items_count,
    currency: wc.totals.currency_code,
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
      partialize: (state) => ({ items: state.items, itemCount: state.itemCount }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
