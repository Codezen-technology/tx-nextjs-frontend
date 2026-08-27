"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { useCartQuery } from "@/lib/hooks/useCart";
import { useCartStore } from "@/lib/stores/cart.store";
import { cartService } from "@/lib/services/cart";
import { queryKeys } from "@/lib/utils/query-keys";
import { hasUserLoggedInCookie } from "@/lib/api/bff-client";
import { BillingForm } from "@/components/checkout/BillingForm";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { UpsellBanner } from "@/components/cart/UpsellBanner";
import type { BillingFormHandle } from "@/components/checkout/BillingForm";

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const billingRef = useRef<BillingFormHandle>(null);
  const clearCart = useCartStore((s) => s.clearCart);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Set once an order is placed so the "empty cart → /cart" redirect below
  // doesn't fire when we clear the cart and navigate to order-confirmation.
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    setIsLoggedIn(hasUserLoggedInCookie());
  }, []);

  // Pre-fetch cart so CheckoutOrderSummary has data + customer billing for prefill.
  const { data: cart, isLoading: cartLoading } = useCartQuery();

  // Only prefill for logged-in customers with a saved billing address.
  const billingDefaults = isLoggedIn ? cart?.billingAddress : undefined;

  // Redirect to cart if nothing to checkout — wait for the cart query to resolve
  // (its truth, not a stale badge). Skip once an order is placed (clearing the
  // cart must not bounce us to /cart).
  useEffect(() => {
    if (!orderPlaced && !cartLoading && cart && cart.item_count === 0) {
      router.replace("/cart");
    }
  }, [orderPlaced, cartLoading, cart, router]);

  const handleOrderSuccess = (orderId: number, orderKey: string) => {
    setOrderPlaced(true);
    // Empty the WooCommerce cart server-side, then mirror locally + refetch so the
    // basket badge and /cart reflect the completed purchase. Fire-and-forget — the
    // order is already placed, so navigation must not wait on this.
    void cartService
      .emptyCart()
      .catch(() => {})
      .finally(() => {
        clearCart();
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail });
      });

    const params = new URLSearchParams();
    if (orderKey) params.set("key", orderKey);
    const qs = params.toString();
    router.push(`/order-confirmation/${orderId}${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="bg-neutral-10 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-neutral-900 py-2.5">
        <div className="container">
          <p className="text-sm text-white">
            <Link href="/" className="font-bold underline">
              Home
            </Link>
            <span className="mx-1">›</span>
            <Link href="/cart" className="underline">
              Cart
            </Link>
            <span className="mx-1">›</span>
            <span>Checkout</span>
          </p>
        </div>
      </div>

      <div className="container py-10">
        <div className="mx-auto max-w-[856px] space-y-8">
          {/* Page title */}
          <div className="space-y-2">
            <h1 className="font-suse text-3xl font-medium text-neutral-900">Checkout</h1>
            {!isLoggedIn && (
              <p className="text-lg text-neutral-500">
                Returning customer?{" "}
                <Link href="/login" className="text-secondary-500 font-bold underline">
                  Click here to login
                </Link>
              </p>
            )}
          </div>

          {/* Billing details */}
          <div className="rounded-lg bg-white p-8 shadow-xs">
            <h2 className="font-suse mb-6 text-2xl font-bold text-neutral-900">Billing Details</h2>
            <BillingForm ref={billingRef} defaultValues={billingDefaults} />
          </div>

          {/* Order summary */}
          <div className="rounded-lg bg-white p-8 shadow-xs">
            <h2 className="font-suse mb-6 text-2xl font-bold text-neutral-900">Order Summary</h2>
            <CheckoutOrderSummary />
          </div>

          {/* Upsell banner */}
          <UpsellBanner variant="checkout" />

          {/* Payment */}
          <div className="rounded-lg bg-[rgba(245,241,233,0.5)] p-8">
            {/* "100% secure payment" sits beside the heading in the design
                (6239:134665), stacking beneath it on mobile — QA-CHECK-A5. */}
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-suse text-2xl font-bold text-[#1a171b]">Payment method</h2>
              <p className="font-open-sans flex items-center gap-2 text-base text-[#1a171b]">
                <ShieldCheck className="h-6 w-6 text-[#1fb356]" aria-hidden />
                100% secure payment
              </p>
            </div>
            {/* Always mount Elements (accepts stripe={null} while unconfigured/loading) so
                free (£0) orders can complete even when Stripe isn't set up. The selector
                shows a config warning + disables submit for paid orders when stripe is null. */}
            <Elements stripe={stripePromise}>
              <PaymentMethodSelector billingRef={billingRef} onSuccess={handleOrderSuccess} />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  );
}
