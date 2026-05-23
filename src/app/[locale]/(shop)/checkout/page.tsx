"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { useCartQuery } from "@/lib/hooks/useCart";
import { BillingForm } from "@/components/checkout/BillingForm";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { UpsellBanner } from "@/components/cart/UpsellBanner";
import type { BillingFormHandle } from "@/components/checkout/BillingForm";

export default function CheckoutPage() {
  const router = useRouter();
  const billingRef = useRef<BillingFormHandle>(null);

  // Pre-fetch cart so CheckoutOrderSummary has data.
  useCartQuery();

  const handleOrderSuccess = (orderId: number) => {
    router.push(`/order-confirmation/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-[#fafbfb]">
      {/* Breadcrumb */}
      <div className="bg-[#00204a] py-2.5">
        <div className="container">
          <p className="text-sm text-white">
            <Link href="/" className="font-bold underline">Home</Link>
            <span className="mx-1">›</span>
            <Link href="/cart" className="underline">Cart</Link>
            <span className="mx-1">›</span>
            <span>Checkout</span>
          </p>
        </div>
      </div>

      <div className="container py-10">
        <div className="mx-auto max-w-[856px] space-y-8">
          {/* Page title */}
          <div className="space-y-2">
            <h1 className="font-suse text-3xl font-medium text-[#00204a]">Checkout</h1>
            <p className="text-lg text-[#3b5374]">
              Returning customer?{" "}
              <Link href="/login" className="font-bold text-[#9e6f21] underline">
                Click here to login
              </Link>
            </p>
          </div>

          {/* Billing details */}
          <div className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-6 font-suse text-2xl font-medium text-[#00204a]">Billing Details</h2>
            <BillingForm ref={billingRef} />
          </div>

          {/* Order summary */}
          <div className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-6 font-suse text-2xl font-medium text-[#00204a]">Order Summary</h2>
            <CheckoutOrderSummary />
          </div>

          {/* Upsell banner */}
          <UpsellBanner variant="checkout" />

          {/* Payment */}
          <div className="rounded-lg bg-[rgba(245,241,233,0.5)] p-8">
            <h2 className="mb-6 font-suse text-2xl font-medium text-[#1a171b]">Payment method</h2>
            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <PaymentMethodSelector
                  billingRef={billingRef}
                  onSuccess={handleOrderSuccess}
                />
              </Elements>
            ) : (
              <div className="rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                Payment is not configured.{" "}
                <code className="text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> is missing.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
