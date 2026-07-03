"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/utils/query-keys";
import { cartService } from "@/lib/services/cart";
import type { Cart, CartError } from "@/lib/stores/cart.store";

/**
 * Cart-level errors worth a STANDING banner: genuine item problems (out of stock,
 * quantity capped, item auto-removed). Two transforms:
 *
 * 1. Dedupe — WC returns the same notice twice (see Network → Preview), which also
 *    collided React keys in the banner.
 * 2. Drop coupon/discount-conflict notices. These are transient action feedback
 *    already surfaced by `CouponInput`'s own mutation error. Worse, WooCommerce
 *    (bulk-discount plugin) re-emits "Coupon cannot be applied when bulk discount
 *    is already applied" on EVERY /cart calculation — even when no coupon is
 *    attached and no apply is in flight — so it can never clear on reload. The real
 *    fix is server-side (stop echoing the notice / detach the invalid coupon); until
 *    then we keep it out of the permanent banner.
 *
 * en-only today; message matching is acceptable and flagged for i18n.
 */
export function standingCartErrors(errors: CartError[]): CartError[] {
  const seen = new Map<string, CartError>();
  for (const e of errors) {
    const msg = e.message.toLowerCase();
    if (msg.includes("coupon") || msg.includes("bulk discount")) continue;
    seen.set(e.code + e.message, e);
  }
  return Array.from(seen.values());
}

/**
 * Sole source of truth for cart DATA. A plain `useQuery` — no side effects — so
 * it is safe to call from as many components (and per-row) as needed; TanStack
 * dedupes by key. The header mirrors `data.item_count` into the persisted store
 * for the pre-hydration badge; nothing else projects cart data anywhere.
 */
export function useCartQuery() {
  return useQuery({
    queryKey: queryKeys.cart.detail,
    queryFn: () => cartService.fetchCart(),
    // Avoid a refetch storm on every mount/window-focus. Mutations explicitly
    // invalidate queryKeys.cart.detail, so post-write freshness is unaffected.
    staleTime: 30_000,
  });
}

/**
 * Read facade for cart DATA. TanStack Query is the single source of truth; the
 * Zustand store holds only UI state (`isOpen`) + the persisted `itemCount` badge.
 * Prefer this over `useCartStore` for any display of items/totals/currency.
 */
export function useCart() {
  const query = useCartQuery();
  const cart = query.data ?? null;
  return {
    cart,
    items: cart?.items ?? [],
    totals: cart, // domain Cart extends CartTotals, so `cart` carries the totals
    itemCount: cart?.item_count ?? 0,
    currency: cart?.currency ?? "£",
    errors: standingCartErrors(cart?.errors ?? []),
    isLoading: query.isLoading,
  };
}

export function useAddToCart() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ product_id, quantity = 1 }: { product_id: number; quantity?: number }) =>
      cartService.addItem(product_id, quantity),
    onSuccess: (cart: Cart) => {
      qc.setQueryData(queryKeys.cart.detail, cart);
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ key, quantity }: { key: string; quantity: number }) =>
      cartService.updateItem(key, quantity),
    // Serialize writes (Phase 3): a typeable quantity field can emit rapid distinct
    // edits. Cancel any in-flight cart refetch first so a slow GET can't resolve
    // after this PUT and clobber the newer quantity the user landed on.
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.cart.detail });
    },
    onSuccess: (cart: Cart) => {
      qc.setQueryData(queryKeys.cart.detail, cart);
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.detail });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.detail, refetchType: "none" });
    },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (key: string) => cartService.removeItem(key),
    // Optimistically drop the row from the query cache (the sole display source),
    // snapshot for rollback. No store write — display no longer reads the store.
    onMutate: async (key) => {
      await qc.cancelQueries({ queryKey: queryKeys.cart.detail });
      const snapshot = qc.getQueryData<Cart>(queryKeys.cart.detail);
      if (snapshot) {
        const items = snapshot.items.filter((i) => i.key !== key);
        qc.setQueryData<Cart>(queryKeys.cart.detail, {
          ...snapshot,
          items,
          item_count: items.reduce((s, i) => s + i.quantity, 0),
        });
      }
      return { snapshot };
    },
    onSuccess: (cart: Cart) => {
      qc.setQueryData(queryKeys.cart.detail, cart);
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        qc.setQueryData(queryKeys.cart.detail, context.snapshot);
      } else {
        qc.invalidateQueries({ queryKey: queryKeys.cart.detail });
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.detail, refetchType: "none" });
    },
  });
}

export function useApplyCoupon() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => cartService.applyCoupon(code),
    onSuccess: (cart: Cart) => {
      qc.setQueryData(queryKeys.cart.detail, cart);
    },
  });
}

export function useRemoveCoupon() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => cartService.removeCoupon(code),
    onSuccess: (cart: Cart) => {
      qc.setQueryData(queryKeys.cart.detail, cart);
    },
  });
}
