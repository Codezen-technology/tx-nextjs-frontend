import { NextResponse } from "next/server";
import { proxyToWCStore } from "@/lib/api/bff";
import { env } from "@/lib/env";

/**
 * Creates a Stripe PaymentIntent from the current WC cart total.
 *
 * Called by ExpressCheckout on the cart page to get a client_secret for
 * the Payment Request API (Apple Pay / Google Pay). The PaymentIntent is
 * created without payment_method_types so Stripe enables dynamic methods.
 */
export async function POST(req: Request) {
  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  // Forward Cart-Token + Nonce from the browser to read the WC cart session.
  const cartRes = await proxyToWCStore("/cart", { method: "GET", request: req });
  const cart = (await cartRes.json()) as {
    totals?: { total_price?: string; currency?: string };
  };

  const totalPence = parseInt(cart.totals?.total_price ?? "0", 10);
  const currency = cart.totals?.currency ?? "gbp";

  if (totalPence <= 0) {
    return NextResponse.json({ error: "Cart total must be greater than zero" }, { status: 400 });
  }

  // Create a PaymentIntent — intentionally omit payment_method_types so Stripe
  // enables dynamic payment methods (Apple Pay, Google Pay, cards, etc.).
  const piRes = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      amount: String(totalPence),
      currency: currency.toLowerCase(),
    }).toString(),
    cache: "no-store",
  });

  const text = await piRes.text();
  if (!text.trim()) {
    return NextResponse.json({ error: "Empty response from Stripe" }, { status: 502 });
  }

  let pi: { id?: string; client_secret?: string; error?: { message?: string } };
  try {
    pi = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid response from Stripe" }, { status: 502 });
  }

  if (pi.error || !pi.client_secret) {
    return NextResponse.json(
      { error: pi.error?.message ?? "Failed to create PaymentIntent" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    clientSecret: pi.client_secret,
    paymentIntentId: pi.id,
    amount: totalPence,
    currency,
  });
}
