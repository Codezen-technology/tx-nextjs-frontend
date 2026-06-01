"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/utils/query-keys";
import { cartService } from "@/lib/services/cart";
import { useCartStore } from "@/lib/stores/cart.store";
import type { Cart } from "@/lib/stores/cart.store";

export function useCartQuery() {
  const setCart = useCartStore((s) => s.setCart);

  const query = useQuery({
    queryKey: queryKeys.cart.detail,
    queryFn: () => cartService.fetchCart(),
  });

  useEffect(() => {
    if (query.data) setCart(query.data);
  }, [query.data, setCart]);
  return query;
}

export function useAddToCart() {
  const qc = useQueryClient();
  const setCart = useCartStore((s) => s.setCart);

  return useMutation({
    mutationFn: ({ product_id, quantity = 1 }: { product_id: number; quantity?: number }) =>
      cartService.addItem(product_id, quantity),
    onSuccess: (cart: Cart) => {
      setCart(cart);
      qc.setQueryData(queryKeys.cart.detail, cart);
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  const setCart = useCartStore((s) => s.setCart);

  return useMutation({
    mutationFn: ({ key, quantity }: { key: string; quantity: number }) =>
      cartService.updateItem(key, quantity),
    onSuccess: (cart: Cart) => {
      setCart(cart);
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
  const setCart = useCartStore((s) => s.setCart);
  const optimisticRemove = useCartStore((s) => s.optimisticRemove);

  return useMutation({
    mutationFn: (key: string) => cartService.removeItem(key),
    onMutate: async (key) => {
      await qc.cancelQueries({ queryKey: queryKeys.cart.detail });
      const snapshot = qc.getQueryData<Cart>(queryKeys.cart.detail);
      optimisticRemove(key);
      return { snapshot };
    },
    onSuccess: (cart: Cart) => {
      setCart(cart);
      qc.setQueryData(queryKeys.cart.detail, cart);
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        setCart(context.snapshot);
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
  const setCart = useCartStore((s) => s.setCart);

  return useMutation({
    mutationFn: (code: string) => cartService.applyCoupon(code),
    onSuccess: (cart: Cart) => {
      setCart(cart);
      qc.setQueryData(queryKeys.cart.detail, cart);
    },
  });
}

export function useRemoveCoupon() {
  const qc = useQueryClient();
  const setCart = useCartStore((s) => s.setCart);

  return useMutation({
    mutationFn: (code: string) => cartService.removeCoupon(code),
    onSuccess: (cart: Cart) => {
      setCart(cart);
      qc.setQueryData(queryKeys.cart.detail, cart);
    },
  });
}
