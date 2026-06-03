"use client";

import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { cn } from "@/lib/utils/cn";
import { useCreateOrder, usePayOrder, useWcStoreCheckout } from "@/lib/hooks/useCheckout";
import { useCartStore } from "@/lib/stores/cart.store";
import { useBuyNowStore } from "@/lib/stores/buy-now.store";
import { SecurePaymentBadge } from "./SecurePaymentBadge";
import type { CreateOrderResponse, WCStoreCheckoutResponse } from "@/lib/services/checkout";
import type { BillingFormHandle } from "./BillingForm";

interface PaymentMethodSelectorProps {
  billingRef: React.RefObject<BillingFormHandle>;
  onSuccess: (orderId: number, orderKey: string) => void;
}

export function PaymentMethodSelector({ billingRef, onSuccess }: PaymentMethodSelectorProps) {
  const [method, setMethod] = useState<"stripe">("stripe");
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buy-Now retry state (REST v3 path only)
  const [pendingOrder, setPendingOrder] = useState<CreateOrderResponse | null>(null);

  const stripe = useStripe();
  const elements = useElements();
  const { mutateAsync: wcStoreCheckout } = useWcStoreCheckout();
  const { mutateAsync: createOrder } = useCreateOrder();
  const { mutateAsync: payOrder } = usePayOrder();
  const cartItems = useCartStore((s) => s.items);
  const cartTotals = useCartStore((s) => s.totals);
  const clearCart = useCartStore((s) => s.clearCart);
  const buyNowItem = useBuyNowStore((s) => s.item);
  const clearBuyNow = useBuyNowStore((s) => s.clear);

  // ─── Store API checkout (standard cart) ────────────────────────────────────

  const handleStoreApiCheckout = async () => {
    const billing = billingRef.current!.getValues();

    if (!stripe || !elements) throw new Error("Stripe is not loaded.");
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) throw new Error("Card element not found.");

    const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
      billing_details: {
        name: `${billing.first_name} ${billing.last_name}`,
        email: billing.email,
        phone: billing.phone || undefined,
        address: {
          line1: billing.address_1,
          line2: billing.address_2 || undefined,
          city: billing.city,
          postal_code: billing.postcode,
          country: billing.country,
          state: billing.state || undefined,
        },
      },
    });

    if (pmError || !paymentMethod) {
      throw new Error(pmError?.message ?? "Failed to process card details.");
    }

    const payload = {
      billing_address: billing,
      shipping_address: billing,
      payment_method: "stripe",
      payment_data: [{ key: "stripe_payment_method", value: paymentMethod.id }] as Array<{
        key: string;
        value: string | boolean;
      }>,
    };

    let result: WCStoreCheckoutResponse = await wcStoreCheckout(payload);

    // Handle 3DS / SCA
    if (result.payment_result.payment_status === "requires_action") {
      const clientSecret = result.payment_result.payment_details.find(
        (d) => d.key === "client_secret",
      )?.value;

      if (!clientSecret) {
        throw new Error("3D Secure required but no client secret was provided.");
      }

      const { error: actionError, paymentIntent } = await stripe.handleCardAction(clientSecret);
      if (actionError) {
        throw new Error(actionError.message ?? "3D Secure verification failed.");
      }

      // Retry with confirmed intent
      result = await wcStoreCheckout({
        ...payload,
        payment_data: [
          { key: "stripe_payment_method", value: paymentMethod.id },
          { key: "stripe_payment_intent", value: paymentIntent!.id },
        ],
      });
    }

    if (result.payment_result.payment_status !== "success") {
      throw new Error("Payment was not successful. Please try again.");
    }

    clearCart();
    clearBuyNow();
    onSuccess(result.order_id, result.order_key);
  };

  // ─── REST v3 checkout (Buy Now path) ───────────────────────────────────────

  const handleBuyNowCheckout = async () => {
    const billing = billingRef.current!.getValues();

    if (!stripe || !elements) throw new Error("Stripe is not loaded.");
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) throw new Error("Card element not found.");

    let order: CreateOrderResponse;

    if (pendingOrder) {
      order = pendingOrder;
    } else {
      order = await createOrder({
        billing,
        payment_method: method,
        line_items: [{ product_id: buyNowItem!.product_id, quantity: buyNowItem!.quantity }],
      });

      if (!order.client_secret) {
        throw new Error("Payment setup failed — no client secret returned.");
      }

      setPendingOrder(order);
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(order.client_secret!, {
      payment_method: { card: cardElement },
    });

    if (error) {
      throw new Error(error.message ?? "Payment failed.");
    }

    await payOrder({
      orderId: order.order_id,
      payment_intent_id: paymentIntent!.id,
      order_key: order.order_key,
    });

    setPendingOrder(null);
    clearBuyNow();
    onSuccess(order.order_id, order.order_key);
  };

  // ─── Submit handler ─────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!billingRef.current) return;

    const valid = await billingRef.current.trigger();
    if (!valid) return;

    setStripeError(null);
    setIsSubmitting(true);

    try {
      if (buyNowItem) {
        await handleBuyNowCheckout();
      } else {
        await handleStoreApiCheckout();
      }
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

        {/* PayPal — coming soon */}
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

      {stripeError && (
        <p className="rounded bg-red-50 px-4 py-2.5 text-sm text-red-600">{stripeError}</p>
      )}

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
