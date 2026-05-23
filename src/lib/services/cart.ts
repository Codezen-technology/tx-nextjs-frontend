import { bffJson } from "@/lib/api/bff-client";
import type { Cart } from "@/lib/stores/cart.store";

export const cartService = {
  fetchCart: () => bffJson<Cart>("/api/cart"),

  addItem: (product_id: number, quantity = 1) =>
    bffJson<Cart>("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({ product_id, quantity }),
    }),

  updateItem: (key: string, quantity: number) =>
    bffJson<Cart>(`/api/cart/items/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (key: string) =>
    bffJson<Cart>(`/api/cart/items/${encodeURIComponent(key)}`, { method: "DELETE" }),

  emptyCart: () => bffJson<Cart>("/api/cart", { method: "DELETE" }),

  applyCoupon: (code: string) =>
    bffJson<Cart>("/api/cart/coupon", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  removeCoupon: (code: string) =>
    bffJson<Cart>(`/api/cart/coupon/${encodeURIComponent(code)}`, { method: "DELETE" }),
};
