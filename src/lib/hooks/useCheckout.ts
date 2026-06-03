"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/utils/query-keys";
import { checkoutService } from "@/lib/services/checkout";
import type { CreateOrderPayload, WCStoreCheckoutPayload } from "@/lib/services/checkout";

export function useWcStoreCheckout() {
  return useMutation({
    mutationFn: (payload: WCStoreCheckoutPayload) => checkoutService.wcStoreCheckout(payload),
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => checkoutService.createOrder(payload),
  });
}

export function usePayOrder() {
  return useMutation({
    mutationFn: ({
      orderId,
      payment_intent_id,
      order_key,
    }: {
      orderId: number;
      payment_intent_id: string;
      order_key?: string;
    }) => checkoutService.payOrder(orderId, payment_intent_id, order_key),
  });
}

export function usePaymentGateways() {
  return useQuery({
    queryKey: queryKeys.payment.gateways,
    queryFn: () => checkoutService.getPaymentGateways(),
    staleTime: 5 * 60_000,
  });
}

export function useOrderDetail(id: number, orderKey?: string | null) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id, orderKey ?? undefined),
    queryFn: () => checkoutService.getOrder(id, orderKey ?? undefined),
    enabled: id > 0,
  });
}
