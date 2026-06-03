"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface BuyNowItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  thumbnail?: string;
}

interface BuyNowStore {
  item: BuyNowItem | null;
  hasHydrated: boolean;
  set: (item: BuyNowItem) => void;
  clear: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useBuyNowStore = create<BuyNowStore>()(
  persist(
    (setState) => ({
      item: null,
      hasHydrated: false,
      set: (item) => setState({ item }),
      clear: () => setState({ item: null }),
      setHasHydrated: (v) => setState({ hasHydrated: v }),
    }),
    {
      name: "lms-buy-now",
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
