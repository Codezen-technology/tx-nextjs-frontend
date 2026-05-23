"use client";

import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { cn } from "@/lib/utils/cn";
import { useCreateOrder, usePayOrder } from "@/lib/hooks/useCheckout";
import { useCartStore } from "@/lib/stores/cart.store";
import { SecurePaymentBadge } from "./SecurePaymentBadge";
import type { BillingDetails } from "@/lib/services/checkout";
import type { BillingFormHandle } from "./BillingForm";

interface PendingOrder {
  orderId: number;
  clientSecret: string;
}

interface PaymentMethodSelectorProps {
  billingRef: React.RefObject<BillingFormHandle>;
  onSuccess: (orderId: number) => void;
}

export function PaymentMethodSelector({ billingRef, onSuccess }: PaymentMethodSelectorProps) {
  const [method, setMethod] = useState<"stripe" | "paypal">("stripe");
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);

  const stripe = useStripe();
  const elements = useElements();
  const { mutateAsync: createOrder } = useCreateOrder();
  const { mutateAsync: payOrder } = usePayOrder();
  const clearCart = useCartStore((s) => s.clearCart);

  const handleSubmit = async () => {
    if (!billingRef.current) return;

    const valid = await billingRef.current.trigger();
    if (!valid) return;

    setStripeError(null);
    setIsSubmitting(true);

    try {
      // On retry after a Stripe failure, reuse the existing WC order instead of creating a duplicate.
      let orderId: number;
      let clientSecret: string;

      if (pendingOrder) {
        orderId = pendingOrder.orderId;
        clientSecret = pendingOrder.clientSecret;
      } else {
        const billing: BillingDetails = {
          ...billingRef.current.getValues(),
          payment_method: method,
        };
        const order = await createOrder(billing);

        if (!order.client_secret) {
          throw new Error(order.stripe_error ?? "Could not initiate payment.");
        }

        orderId = order.order_id;
        clientSecret = order.client_secret;
        setPendingOrder({ orderId, clientSecret });
      }

      if (method === "stripe") {
        if (!stripe || !elements) throw new Error("Stripe is not loaded.");

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) throw new Error("Card element not found.");

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardElement },
        });

        if (error) {
          // Keep pendingOrder set so the next attempt reuses this WC order.
          setStripeError(error.message ?? "Payment failed.");
          return;
        }

        // Confirm server-side: marks WC order as processing and empties the cart on PHP side.
        await payOrder({ orderId, payment_intent_id: paymentIntent!.id });
      }

      setPendingOrder(null);
      clearCart();
      onSuccess(orderId);
    } catch (err) {
      setStripeError((err as Error).message ?? "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Method list */}
      <div className="overflow-hidden rounded border border-[#e1d2ba]">
        {/* Credit/Debit Card */}
        <div
          className={cn(
            "border-b border-[#e1d2ba] bg-white px-4 py-3.5 transition-colors",
            method === "stripe" && "bg-[#fdfaf5]",
          )}
        >
          <button
            type="button"
            onClick={() => setMethod("stripe")}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border-2",
                  method === "stripe"
                    ? "border-[#0d6efd] bg-[#0d6efd]"
                    : "border-gray-300 bg-white",
                )}
              >
                {method === "stripe" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span className="text-sm font-medium text-[#1a171b]">Credit/Debit Card</span>
            </div>
            <div className="flex items-center gap-1.5">
              {["VISA", "MC", "AMEX", "DISC"].map((l) => (
                <span
                  key={l}
                  className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[8px] font-bold text-gray-500"
                >
                  {l}
                </span>
              ))}
            </div>
          </button>

          {method === "stripe" && (
            <div className="mt-4 px-7">
              <p className="mb-2 text-xs font-semibold text-[#1a171b]">Card number</p>
              <div className="rounded border border-[#e1d2ba] bg-white px-4 py-3.5">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: "16px",
                        color: "#00204a",
                        fontFamily: "Open Sans, sans-serif",
                        "::placeholder": { color: "#838284" },
                      },
                      invalid: { color: "#dc3545" },
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* PayPal */}
        <div className="bg-white px-4 py-3.5 opacity-50">
          <div className="flex items-center gap-3">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-300 bg-white" />
            <span className="text-sm font-medium text-[#1a171b]">PayPal</span>
            <span className="ml-auto rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-medium text-gray-400">
              Coming soon
            </span>
          </div>
        </div>
      </div>

      {/* Stripe error */}
      {stripeError && (
        <p className="rounded bg-red-50 px-4 py-2.5 text-sm text-red-600">{stripeError}</p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !stripe}
        className="w-full rounded bg-[#9e6f21] px-6 py-4 text-base font-medium text-white transition-colors hover:bg-[#7d5819] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Processing…" : "Proceed to Checkout"}
      </button>

      <SecurePaymentBadge />
    </div>
  );
}
