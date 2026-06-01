import { cartFetch } from "@/lib/api/bff-client";
import { normalizeWCCart } from "@/lib/stores/cart.store";
import type { Cart, WCStoreCart } from "@/lib/stores/cart.store";

async function fetchCartNormalized(path: string, init?: RequestInit): Promise<Cart> {
  const wc = await cartFetch<WCStoreCart>(path, init);
  return normalizeWCCart(wc);
}

export const cartService = {
  fetchCart: () => fetchCartNormalized("/api/cart"),

  addItem: (product_id: number, quantity = 1) =>
    fetchCartNormalized("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({ product_id, quantity }),
    }),

  updateItem: (key: string, quantity: number) =>
    fetchCartNormalized(`/api/cart/items/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),

  removeItem: async (key: string): Promise<Cart> => {
    await cartFetch<unknown>(`/api/cart/items/${encodeURIComponent(key)}`, { method: "DELETE" });
    return fetchCartNormalized("/api/cart");
  },

  emptyCart: async (): Promise<Cart> => {
    await cartFetch<unknown>("/api/cart", { method: "DELETE" });
    return fetchCartNormalized("/api/cart");
  },

  applyCoupon: (code: string) =>
    fetchCartNormalized("/api/cart/coupon", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  removeCoupon: async (code: string): Promise<Cart> => {
    await cartFetch<unknown>(`/api/cart/coupon/${encodeURIComponent(code)}`, { method: "DELETE" });
    return fetchCartNormalized("/api/cart");
  },
};
