"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

interface CartStore {
  items: CartItem[];
  totals: CartTotals | null;
  itemCount: number;
  isOpen: boolean;
  hasHydrated: boolean;
  setCart: (cart: Cart) => void;
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
