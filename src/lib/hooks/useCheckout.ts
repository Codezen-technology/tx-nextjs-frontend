"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/utils/query-keys";
import { checkoutService } from "@/lib/services/checkout";
import type { BillingDetails } from "@/lib/services/checkout";

export function useCreateOrder() {
  return useMutation({
    mutationFn: (billing: BillingDetails) => checkoutService.createOrder(billing),
  });
}

export function usePayOrder() {
  return useMutation({
    mutationFn: ({ orderId, payment_intent_id }: { orderId: number; payment_intent_id: string }) =>
      checkoutService.payOrder(orderId, payment_intent_id),
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: queryKeys.payment.methods,
    queryFn: () => checkoutService.getPaymentMethods(),
    staleTime: 5 * 60_000,
  });
}

export function useOrderDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => checkoutService.getOrder(id),
    enabled: id > 0,
  });
}
