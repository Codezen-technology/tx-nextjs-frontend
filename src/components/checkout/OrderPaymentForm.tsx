"use client";

import { useRef, useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { stripePromise } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { BillingForm, type BillingFormHandle } from "@/components/checkout/BillingForm";
import { checkoutService } from "@/lib/services/checkout";

interface OrderPaymentFormProps {
  orderId: number;
  orderKey: string;
  /** Order total (inc. VAT) for the pay button label — authoritative amount lives on the WC order. */
  total: number;
  onPaid: () => void;
  onCancel?: () => void;
}

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#00204a",
      fontFamily: "Open Sans, sans-serif",
      "::placeholder": { color: "#838284" },
    },
    invalid: { color: "#dc3545" },
  },
} as const;

/**
 * Pays an existing WooCommerce order with Stripe via the WC Store API checkout-order
 * endpoint. Generic and reusable for any already-created order (B2B licences /
 * subscriptions, retry-pay from Order History). Wraps its own Stripe <Elements>.
 */
export function OrderPaymentForm(props: OrderPaymentFormProps) {
  if (!stripePromise) {
    return (
      <p className="py-6 text-sm text-neutral-500">
        Online payment is not available right now. Please try again later.
      </p>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFields {...props} />
    </Elements>
  );
}

function PaymentFields({ orderId, orderKey, total, onPaid, onCancel }: OrderPaymentFormProps) {
  const billingRef = useRef<BillingFormHandle | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pay = async () => {
    if (!billingRef.current) return;

    const valid = await billingRef.current.trigger();
    if (!valid) return;

    if (!stripe || !elements) {
      setError("Stripe is not loaded yet. Please wait a moment and retry.");
      return;
    }
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card field not found.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const billing = billingRef.current.getValues();

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

      const base = {
        key: orderKey,
        billing_address: billing,
        shipping_address: billing,
        payment_method: "stripe",
      };

      let result = await checkoutService.payOrderViaStore(orderId, {
        ...base,
        payment_data: [{ key: "stripe_payment_method", value: paymentMethod.id }],
      });

      // Handle 3DS / SCA.
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

        result = await checkoutService.payOrderViaStore(orderId, {
          ...base,
          payment_data: [
            { key: "stripe_payment_method", value: paymentMethod.id },
            { key: "stripe_payment_intent", value: paymentIntent!.id },
          ],
        });
      }

      if (result.payment_result.payment_status !== "success") {
        throw new Error("Payment was not successful. Please try again.");
      }

      onPaid();
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <BillingForm />

      <div>
        <p className="mb-2 text-xs font-semibold text-[#1a171b]">Card details</p>
        <div className="rounded border border-[#e1d2ba] bg-white px-4 py-3.5">
          <CardElement options={CARD_OPTIONS} />
        </div>
      </div>

      {error && <p className="rounded bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={pay}
          disabled={submitting || !stripe}
          className="flex-1 bg-[#9e6f21] hover:bg-[#7d5819]"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Processing…
            </>
          ) : (
            `Pay £${total.toFixed(2)}`
          )}
        </Button>
      </div>
    </div>
  );
}
