"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { businessDashboardService } from "@/lib/services/business-dashboard";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type {
  AggregatedActiveSubscription,
  LicenceCartItem,
  LicencePricingTier,
  PricingTab,
  UpsellHint,
} from "@/types/business-pricing";

const pricingQueryKeys = {
  config: ["business", "licence-pricing"] as const,
  order: (itemsKey: string) => ["business", "licence-order", itemsKey] as const,
  courseSearch: (search: string) => ["business", "licence-course-search", search] as const,
  activeSub: ["business", "active-subscription"] as const,
};

function computeUpsellHint(qty: number, tiers: LicencePricingTier[]): UpsellHint | null {
  for (const tier of tiers) {
    if (qty < tier.min_qty) {
      return {
        next_tier_qty: tier.min_qty,
        next_discount: tier.discount_percent,
        qty_needed: tier.min_qty - qty,
      };
    }
  }
  return null;
}

function getTierDiscount(qty: number, tiers: LicencePricingTier[]): number {
  let discount = 0;
  for (const tier of tiers) {
    if (qty >= tier.min_qty) discount = tier.discount_percent;
  }
  return discount;
}

export function useBusinessPricing() {
  const [tab, setTab] = useState<PricingTab>("licence");
  const [cart, setCart] = useState<LicenceCartItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [seatQty, setSeatQty] = useState(1);
  const [subQuoteOpen, setSubQuoteOpen] = useState(false);
  const [subContactOpen, setSubContactOpen] = useState(false);

  const { data: pricingConfig } = useQuery({
    queryKey: pricingQueryKeys.config,
    queryFn: () => businessDashboardService.getLicencePricing(),
    staleTime: 5 * 60_000,
  });

  const tiers = pricingConfig?.tiers ?? [];
  const subBasePrice = pricingConfig?.subscription_price ?? 0;
  const vatRate = pricingConfig?.vat_enabled ? (pricingConfig?.vat_rate ?? 0) : 0;
  const vatEnabled = vatRate > 0;
  const vatLabel =
    pricingConfig?.vat_label ?? (vatRate > 0 ? `VAT (${Math.round(vatRate * 100)}%)` : "");

  const orderItems = useMemo(
    () => cart.map(({ courseId, qty }) => ({ course_id: courseId, qty })),
    [cart],
  );

  const orderItemsKey = JSON.stringify(orderItems);

  const { data: summary, isFetching: calcLoading } = useQuery({
    queryKey: pricingQueryKeys.order(orderItemsKey),
    queryFn: () => businessDashboardService.calculateLicenceOrder(orderItems),
    enabled: orderItems.length > 0,
    staleTime: 0,
  });

  const { data: activeSub } = useQuery({
    queryKey: pricingQueryKeys.activeSub,
    queryFn: () => businessDashboardService.getActiveSubscription(),
    staleTime: 60_000,
  });

  const checkoutMutation = useMutation({
    mutationFn: (items: Array<{ course_id: number; qty: number }>) =>
      businessDashboardService.checkoutLicences(items),
    onSuccess: (data) => {
      const url = data.pay_url ?? data.checkout_url;
      if (url) window.location.href = url;
    },
  });

  const subCheckoutMutation = useMutation({
    mutationFn: (qty: number) => businessDashboardService.checkoutSubscriptionLicences(qty),
    onSuccess: (data) => {
      const url = data.pay_url ?? data.checkout_url;
      if (url) window.location.href = url;
    },
  });

  const quoteMutation = useMutation({
    mutationFn: businessDashboardService.requestLicenceQuote,
  });

  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const upsellHint = useMemo(() => computeUpsellHint(totalQty, tiers), [totalQty, tiers]);

  const subDiscount = getTierDiscount(seatQty, tiers);
  const subSubtotal = subBasePrice * seatQty;
  const subDiscountAmt = subSubtotal * (subDiscount / 100);
  const subDiscounted = subSubtotal - subDiscountAmt;
  const subVat = subDiscounted * vatRate;
  const subTotal = subDiscounted + subVat;
  const subUpsellHint = useMemo(() => computeUpsellHint(seatQty, tiers), [seatQty, tiers]);

  const maxDiscount = tiers.reduce((max, t) => Math.max(max, t.discount_percent), 0);

  const addToCart = (item: LicenceCartItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.courseId === item.courseId);
      if (existing) {
        return prev.map((c) =>
          c.courseId === item.courseId
            ? { ...c, qty: c.qty + 1, lineSubtotal: c.pricePerLicence * (c.qty + 1) }
            : c,
        );
      }
      return [...prev, item];
    });
  };

  const updateQty = (courseId: number, qty: number) => {
    setCart((prev) =>
      prev.map((c) =>
        c.courseId === courseId ? { ...c, qty, lineSubtotal: c.pricePerLicence * qty } : c,
      ),
    );
  };

  const removeItem = (courseId: number) => {
    setCart((prev) => prev.filter((c) => c.courseId !== courseId));
  };

  const handleCheckout = () => checkoutMutation.mutate(orderItems);
  const handleSubCheckout = () => subCheckoutMutation.mutate(seatQty);

  const handleQuoteSubmit = (data: { name: string; email: string; message: string }) => {
    quoteMutation.mutate(
      { type: "licence", items: orderItems, ...data },
      {
        onSuccess: () => {
          setQuoteOpen(false);
          setQuoteSuccess(true);
        },
      },
    );
  };

  const handleSubQuoteSubmit = (data: { name: string; email: string; message: string }) => {
    quoteMutation.mutate(
      { type: "subscription", qty: seatQty, ...data },
      {
        onSuccess: () => {
          setSubQuoteOpen(false);
          setQuoteSuccess(true);
        },
      },
    );
  };

  return {
    tab,
    setTab,
    cart,
    addToCart,
    updateQty,
    removeItem,
    modalOpen,
    setModalOpen,
    quoteOpen,
    setQuoteOpen,
    quoteSuccess,
    setQuoteSuccess,
    subQuoteOpen,
    setSubQuoteOpen,
    subContactOpen,
    setSubContactOpen,
    tiers,
    maxDiscount,
    subBasePrice,
    vatEnabled,
    vatLabel,
    summary: summary ?? null,
    calcLoading,
    activeSub: activeSub as AggregatedActiveSubscription | null | undefined,
    seatQty,
    setSeatQty,
    subDiscount,
    subSubtotal,
    subDiscountAmt,
    subVat,
    subTotal,
    subUpsellHint,
    totalQty,
    upsellHint,
    handleCheckout,
    handleSubCheckout,
    handleQuoteSubmit,
    handleSubQuoteSubmit,
    checkoutLoading: checkoutMutation.isPending,
    subCheckoutLoading: subCheckoutMutation.isPending,
    quoteLoading: quoteMutation.isPending,
  };
}

export function useLicenceCourseSearch(query: string, perPage = 10) {
  const debounced = useDebounce(query, 400);

  return useQuery({
    queryKey: pricingQueryKeys.courseSearch(debounced),
    queryFn: () =>
      businessDashboardService.searchLicenceCourses({ search: debounced, per_page: perPage }),
    enabled: debounced.length > 1,
    staleTime: 30_000,
    select: (data) => data.courses ?? [],
  });
}
