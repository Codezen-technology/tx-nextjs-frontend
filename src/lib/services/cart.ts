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

  removeItem: (key: string) =>
    fetchCartNormalized(`/api/cart/items/${encodeURIComponent(key)}`, { method: "DELETE" }),

  emptyCart: () => fetchCartNormalized("/api/cart", { method: "DELETE" }),

  applyCoupon: (code: string) =>
    fetchCartNormalized("/api/cart/coupon", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  removeCoupon: (code: string) =>
    fetchCartNormalized(`/api/cart/coupon/${encodeURIComponent(code)}`, { method: "DELETE" }),
};
