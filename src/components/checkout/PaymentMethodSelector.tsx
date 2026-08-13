"use client";

import { useRef, useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { cn } from "@/lib/utils/cn";
import { useWcStoreCheckout } from "@/lib/hooks/useCheckout";
import { useCart } from "@/lib/hooks/useCart";
import { stripePromise } from "@/lib/stripe";
import { stripeCardPaymentData, findClientSecret } from "@/lib/services/checkout";
import { CheckoutProcessingOverlay } from "./CheckoutProcessingOverlay";
import { SecurePaymentBadge } from "./SecurePaymentBadge";
import type { BillingFormHandle } from "./BillingForm";

interface PaymentMethodSelectorProps {
  billingRef: React.RefObject<BillingFormHandle | null>;
  onSuccess: (orderId: number, orderKey: string) => void;
}

export function PaymentMethodSelector({ billingRef, onSuccess }: PaymentMethodSelectorProps) {
  const [method, setMethod] = useState<"stripe">("stripe");
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Synchronous re-entrancy guard. `isSubmitting` is React state (async) so it can't
  // block a double-click that lands before the re-render — a ref can. Prevents two
  // checkout POSTs → duplicate orders / double charge.
  const submitting = useRef(false);

  const stripe = useStripe();
  const elements = useElements();
  const { mutateAsync: wcStoreCheckout } = useWcStoreCheckout();

  // Zero-total orders (e.g. 100% coupon) need no card — WC processes them as free.
  // Gate on cartLoading: an unresolved total defaults to 0, which would wrongly flash
  // the free-order path (and let a paid cart submit with no payment) before load.
  const { totals, currency, isLoading: cartLoading } = useCart();
  const orderTotal = totals?.total ?? 0;
  const isFreeOrder = !cartLoading && orderTotal <= 0;
  // stripePromise is null only when no publishable key is set (vs `stripe` from
  // useStripe(), which is also null while the SDK is still loading). Lets us warn on
  // a genuinely unconfigured gateway without false-flagging the loading state.
  const stripeUnconfigured = stripePromise === null;

  // ─── Free order checkout (no payment) ──────────────────────────────────────

  const handleFreeCheckout = async () => {
    const billing = billingRef.current!.getValues();

    // Omit payment_method/payment_data: WC's Store API sees the order as
    // needs_payment=false and completes it without invoking a gateway.
    const result = await wcStoreCheckout({
      billing_address: billing,
      shipping_address: billing,
      payment_method: "",
    });

    if (result.payment_result.payment_status !== "success") {
      throw new Error("Order could not be completed. Please try again.");
    }

    onSuccess(result.order_id, result.order_key);
  };

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

    const result = await wcStoreCheckout({
      billing_address: billing,
      shipping_address: billing,
      payment_method: "stripe",
      payment_data: stripeCardPaymentData(paymentMethod.id),
    });

    // Deferred-intent SCA: the order is already created and the PaymentIntent
    // confirmed server-side. On `requires_action` we finish 3DS client-side; the
    // gateway finalizes the order — no second checkout POST (would duplicate).
    if (result.payment_result.payment_status === "requires_action") {
      const clientSecret = findClientSecret(result.payment_result.payment_details);
      if (!clientSecret) {
        throw new Error("Card authentication required but no client secret was provided.");
      }

      const { error: actionError, paymentIntent } = await stripe.handleNextAction({ clientSecret });
      if (actionError) {
        throw new Error(actionError.message ?? "Card authentication failed.");
      }
      if (paymentIntent?.status !== "succeeded") {
        throw new Error("Payment was not completed. Please try again.");
      }

      onSuccess(result.order_id, result.order_key);
      return;
    }

    if (result.payment_result.payment_status !== "success") {
      throw new Error("Payment was not successful. Please try again.");
    }

    onSuccess(result.order_id, result.order_key);
  };

  // ─── Submit handler ─────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    // Re-entrancy guard set synchronously, before any await, so a double-click can't
    // slip a second submit through while validation is still pending.
    if (submitting.current || !billingRef.current) return;
    submitting.current = true;
    setIsSubmitting(true);

    try {
      const valid = await billingRef.current.trigger();
      if (!valid) return;

      setStripeError(null);

      if (isFreeOrder) {
        await handleFreeCheckout();
      } else {
        await handleStoreApiCheckout();
      }
    } catch (err) {
      setStripeError((err as Error).message ?? "Something went wrong.");
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <CheckoutProcessingOverlay show={isSubmitting} />

      {isFreeOrder ? (
        /* Free order — no payment required */
        <div className="rounded border border-green-200 bg-green-50 px-4 py-3.5 text-sm text-green-700">
          No payment required — your order total is {currency}
          {orderTotal.toFixed(2)}. Click below to complete your order.
        </div>
      ) : stripeUnconfigured ? (
        /* Paid order but no Stripe key configured — card entry is impossible. */
        <div className="rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Card payment is currently unavailable. Please contact support to complete your purchase.
        </div>
      ) : (
        /* Method list */
        <div className="border-secondary-100 overflow-hidden rounded border">
          {/* Credit/Debit Card */}
          <div
            className={cn(
              "border-secondary-100 border-b bg-white px-4 py-3.5 transition-colors",
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
                <div className="border-secondary-100 rounded border bg-white px-4 py-3.5">
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
      )}

      {stripeError && (
        <p className="rounded bg-red-50 px-4 py-2.5 text-sm text-red-600">{stripeError}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || cartLoading || (!isFreeOrder && !stripe)}
        className="bg-secondary-600 w-full rounded px-6 py-4 text-base font-medium text-white transition-colors hover:bg-[#7d5819] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Processing…" : isFreeOrder ? "Complete Order" : "Proceed to Checkout"}
      </button>

      <SecurePaymentBadge />
    </div>
  );
}
