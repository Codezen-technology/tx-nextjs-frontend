import { NextResponse } from "next/server";
import { env, getServerWpJsonBase } from "@/lib/env";

/**
 * Certificate confirm — client-triggered, SERVER-verified recording.
 *
 * The browser calls this right after `confirmCardPayment` succeeds. We do NOT
 * trust the client's "it succeeded" claim: we retrieve the PaymentIntent from
 * Stripe server-side and require `status === "succeeded"` before recording. This
 * is the no-webhook path (no `stripe listen` needed); the Stripe webhook remains
 * an idempotent safety net for the browser-crash case.
 *
 * @see docs/CERTIFICATE_PAGE_PLAN.md
 */

interface StripePI {
  id: string;
  status: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

async function retrievePaymentIntent(id: string): Promise<StripePI | null> {
  if (!env.STRIPE_SECRET_KEY) return null;
  const res = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as StripePI;
}

export async function POST(req: Request) {
  let body: { payment_intent_id?: string };
  try {
    body = (await req.json()) as { payment_intent_id?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const piId = body.payment_intent_id?.trim();
  if (!piId) {
    return NextResponse.json({ error: "payment_intent_id is required" }, { status: 400 });
  }

  const pi = await retrievePaymentIntent(piId);
  if (!pi) {
    return NextResponse.json({ error: "Could not verify payment" }, { status: 502 });
  }
  if (pi.status !== "succeeded") {
    return NextResponse.json(
      { error: "Payment not completed", status: pi.status },
      { status: 402 },
    );
  }

  const res = await fetch(`${getServerWpJsonBase()}/lms-backend/v1/certificate/record`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      internal_secret: env.WP_INTERNAL_SECRET,
      payment_intent_id: pi.id,
      amount_minor: pi.amount,
      currency: pi.currency,
      metadata: pi.metadata ?? {},
    }),
    cache: "no-store",
  });

  const json = (await res.json().catch(() => ({}))) as { data?: unknown; error?: string };
  if (!res.ok) {
    return NextResponse.json({ error: "Record failed" }, { status: 502 });
  }
  return NextResponse.json(json.data ?? json);
}
