"use client";

import { create } from "zustand";

export interface BuyNowItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  thumbnail?: string;
}

interface BuyNowStore {
  item: BuyNowItem | null;
  set: (item: BuyNowItem) => void;
  clear: () => void;
}

export const useBuyNowStore = create<BuyNowStore>((setState) => ({
  item: null,
  set: (item) => setState({ item }),
  clear: () => setState({ item: null }),
}));
