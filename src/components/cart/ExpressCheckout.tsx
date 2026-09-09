"use client";

import { useMemo, useRef, useState } from "react";
import { Elements, ExpressCheckoutElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type {
  StripeElementsOptions,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementOptions,
} from "@stripe/stripe-js";
import { stripePromise } from "@/lib/stripe";
import { useCart } from "@/lib/hooks/useCart";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import {
  checkoutService,
  findClientSecret,
  stripeCardPaymentData,
  walletBillingAddress,
} from "@/lib/services/checkout";

interface ExpressCheckoutProps {
  /**
   * Called once the order is paid. The caller owns everything that follows —
   * clearing the cart and navigating — so that a single place does it once.
   */
  onSuccess: (orderId: number, orderKey: string) => void;
}

const ELEMENT_OPTIONS: StripeExpressCheckoutElementOptions = {
  // The design stacks Apple Pay above Google Pay, so one button per row.
  layout: { maxColumns: 1, overflow: "never" },
  // WooCommerce rejects a checkout with blank required address fields, and the
  // wallet sheet is the only place an express buyer supplies one.
  billingAddressRequired: true,
  emailRequired: true,
  // Only the two wallets this change is about — Link/PayPal/Klarna would each
  // need their own WC gateway wiring before they could complete an order.
  paymentMethods: {
    applePay: "auto",
    googlePay: "auto",
    link: "never",
    paypal: "never",
    amazonPay: "never",
    klarna: "never",
  },
  buttonTheme: { applePay: "black", googlePay: "black" },
  buttonType: { applePay: "buy", googlePay: "buy" },
  buttonHeight: 48,
};

/**
 * Apple Pay / Google Pay express checkout for the cart page.
 *
 * Uses Stripe's Express Checkout Element in deferred-intent mode: Elements is
 * told the amount and currency up front, the element renders whichever wallets
 * the device supports, and on confirm we turn the wallet response into a
 * PaymentMethod. WooCommerce still creates the PaymentIntent and remains the
 * source of truth for the amount charged — the total passed here only decides
 * what the wallet sheet displays.
 */
export function ExpressCheckout({ onSuccess }: ExpressCheckoutProps) {
  const { totals, currencyCode, isLoading } = useCart();

  const amount = totals ? Math.round(totals.total * 100) : 0;

  const options = useMemo<StripeElementsOptions>(
    () => ({
      mode: "payment",
      amount,
      // `useCart().currency` is a display symbol ("£"); Stripe needs the ISO code.
      currency: currencyCode.toLowerCase(),
      // Required to create a PaymentMethod from Elements without an intent.
      paymentMethodCreation: "manual",
    }),
    [amount, currencyCode],
  );

  // Elements cannot be created with a zero amount, so mount nothing until the
  // cart has loaded a payable total.
  if (!stripePromise || isLoading || amount <= 0) return null;

  return (
    <Elements stripe={stripePromise} options={options}>
      <ExpressCheckoutForm onSuccess={onSuccess} />
    </Elements>
  );
}

function ExpressCheckoutForm({ onSuccess }: ExpressCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { site_name } = useSiteSettings();
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  const handleConfirm = async (event: StripeExpressCheckoutElementConfirmEvent) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setError(null);

    try {
      if (!stripe || !elements) throw new Error("Stripe is not loaded.");

      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message ?? "Could not read the wallet payment details.");
      }

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({ elements });
      if (pmError || !paymentMethod) {
        throw new Error(pmError?.message ?? "Could not create a payment method.");
      }

      // Same contract as the card checkout — WC creates and confirms the intent.
      const result = await checkoutService.wcStoreCheckout({
        billing_address: walletBillingAddress(event.billingDetails),
        payment_method: "stripe",
        payment_data: stripeCardPaymentData(paymentMethod.id),
      });

      if (result.payment_result.payment_status === "requires_action") {
        const clientSecret = findClientSecret(result.payment_result.payment_details);
        if (!clientSecret) {
          throw new Error("Authentication required but no client secret was provided.");
        }

        const { error: actionError, paymentIntent } = await stripe.handleNextAction({
          clientSecret,
        });
        if (actionError) throw new Error(actionError.message ?? "Payment authentication failed.");
        if (paymentIntent?.status !== "succeeded") {
          throw new Error("Payment was not completed. Please try again.");
        }
      } else if (result.payment_result.payment_status !== "success") {
        throw new Error("Payment was not successful. Please try again.");
      }

      onSuccess(result.order_id, result.order_key);
    } catch (err) {
      const message = (err as Error).message || "Something went wrong.";
      // Dismisses the wallet sheet and shows the reason inside it.
      event.paymentFailed({ reason: "fail", message });
      setError(message);
    } finally {
      processingRef.current = false;
    }
  };

  // The element is never wrapped in anything hidden. Stripe has to lay the
  // element out to work out which wallets the device can offer, and a
  // `display: none` ancestor would deny it that — leaving the element reporting
  // no wallets, which would keep the wrapper hidden forever. It draws nothing
  // and takes almost no height when there is nothing to offer, so only the
  // divider is conditional. The attribute is how the e2e suite reads the state.
  return (
    <div data-express-checkout={available ? "available" : "unavailable"}>
      {available && (
        // "or" divider — matches the white summary card it sits in.
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-gray-500">or</span>
          </div>
        </div>
      )}

      <ExpressCheckoutElement
        options={{ ...ELEMENT_OPTIONS, business: { name: site_name } }}
        onReady={({ availablePaymentMethods }) => setAvailable(Boolean(availablePaymentMethods))}
        onConfirm={handleConfirm}
      />

      {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
