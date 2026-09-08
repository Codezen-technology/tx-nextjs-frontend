"use client";

import { useEffect, useRef, useState } from "react";
import { PaymentRequestButtonElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { PaymentRequest } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/lib/hooks/useCart";
import { cartService } from "@/lib/services/cart";
import { checkoutService, stripeCardPaymentData, findClientSecret } from "@/lib/services/checkout";
import { queryKeys } from "@/lib/utils/query-keys";

interface ExpressCheckoutProps {
  onSuccess: (orderId: number, orderKey: string) => void;
}

/**
 * Apple Pay / Google Pay express checkout buttons for the cart page.
 *
 * Uses Stripe's PaymentRequestButtonElement which auto-detects device support
 * and renders the appropriate wallet button(s). When the user taps a wallet,
 * a PaymentMethod is created via the Payment Request API and submitted to the
 * WC Store API checkout endpoint — the same flow as card payments.
 */
export function ExpressCheckout({ onSuccess }: ExpressCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  const { totals, currency, isLoading: cartLoading } = useCart();

  // ─── Initialise Payment Request when cart loads ──────────────────────────

  useEffect(() => {
    if (!stripe || cartLoading || !totals || totals.total <= 0) return;

    const pr = stripe.paymentRequest({
      country: "GB",
      currency: (currency ?? "gbp").toLowerCase(),
      total: {
        label: "Training Excellence",
        amount: Math.round(totals.total * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Only show the button(s) when at least one wallet is available.
    pr.canMakePayment().then((result) => {
      if (result) setPaymentRequest(pr);
    });
  }, [stripe, cartLoading, totals, currency]);

  // ─── Handle payment method from Apple Pay / Google Pay ───────────────────

  useEffect(() => {
    if (!paymentRequest) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = async (event: any) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setError(null);

      try {
        if (!stripe || !elements) {
          throw new Error("Stripe is not loaded.");
        }

        // Build billing details from the wallet response.
        const billing = {
          first_name: event.payerName?.split(" ")[0] ?? "",
          last_name: event.payerName?.split(" ").slice(1).join(" ") ?? "",
          email: event.payerEmail ?? "",
          address_1: "",
          city: "",
          postcode: "",
          country: "GB",
        };

        // Submit to WC Store API — same contract as card payments.
        const result = await checkoutService.wcStoreCheckout({
          billing_address: billing,
          shipping_address: billing,
          payment_method: "stripe",
          payment_data: stripeCardPaymentData(event.paymentMethod.id),
        });

        // Handle 3DS / SCA if required.
        if (result.payment_result.payment_status === "requires_action") {
          const clientSecret = findClientSecret(result.payment_result.payment_details);
          if (!clientSecret) {
            throw new Error("Authentication required but no client secret was provided.");
          }

          const { error: actionError, paymentIntent } = await stripe.handleNextAction({
            clientSecret,
          });

          if (actionError) {
            throw new Error(actionError.message ?? "Payment authentication failed.");
          }
          if (paymentIntent?.status !== "succeeded") {
            throw new Error("Payment was not completed. Please try again.");
          }
        } else if (result.payment_result.payment_status !== "success") {
          throw new Error("Payment was not successful. Please try again.");
        }

        event.complete("success");

        // Clear cart and redirect to order confirmation.
        cartService
          .emptyCart()
          .catch(() => {})
          .finally(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail });
          });

        onSuccess(result.order_id, result.order_key);
      } catch (err) {
        event.complete("fail");
        setError((err as Error).message ?? "Something went wrong.");
      } finally {
        processingRef.current = false;
      }
    };

    paymentRequest.on("paymentmethod", handler);
    return () => {
      paymentRequest.off("paymentmethod", handler);
    };
  }, [paymentRequest, stripe, elements, router, queryClient, onSuccess]);

  // Don't render if cart is loading, empty, or no wallet is available.
  if (cartLoading || !totals || totals.total <= 0 || !paymentRequest) return null;

  return (
    <div>
      {/* "or" divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-gray-500">or</span>
        </div>
      </div>

      {/* Apple Pay / Google Pay button(s) */}
      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: "buy",
              theme: "dark",
              height: "48px",
            },
          },
        }}
      />

      {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
