import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { env, getServerWpJsonBase } from "@/lib/env";

/**
 * Stripe webhook — authoritative certificate fulfilment (Option C).
 *
 * Verifies the Stripe signature (raw body, no SDK), and on
 * `payment_intent.succeeded` forwards the verified PaymentIntent to the WP plugin
 * `/certificate/record` (shared secret) which records the GF entry + emails the
 * buyer. This — not the browser — is the source of truth: paid ⇒ recorded.
 *
 * @see docs/CERTIFICATE_PAGE_PLAN.md
 */

export const runtime = "nodejs"; // needs node:crypto + the raw request body

const TOLERANCE_SECONDS = 300;

/** Verify a Stripe-Signature header against the raw body. */
function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;

  let timestamp = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    else if (key === "v1") signatures.push(value);
  }
  if (!timestamp || signatures.length === 0) return false;

  // Replay window.
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");

  const expBuf = Buffer.from(expected);
  return signatures.some((sig) => {
    const sigBuf = Buffer.from(sig);
    return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
  });
}

interface StripeEvent {
  type: string;
  data: {
    object: { id: string; amount: number; currency: string; metadata?: Record<string, string> };
  };
}

export async function POST(req: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  if (!verifySignature(rawBody, req.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Only payment success drives fulfilment; ack everything else.
  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const pi = event.data.object;

  const res = await fetch(`${getServerWpJsonBase()}/lms-backend/v1/certificate/record`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-LMS-Internal-Secret": env.WP_INTERNAL_SECRET,
    },
    body: JSON.stringify({
      // Header + body, since some hosts strip custom headers before PHP.
      internal_secret: env.WP_INTERNAL_SECRET,
      payment_intent_id: pi.id,
      amount_minor: pi.amount,
      currency: pi.currency,
      metadata: pi.metadata ?? {},
    }),
    cache: "no-store",
  });

  // Non-2xx → return 5xx so Stripe retries (the plugin is idempotent per PI id).
  if (!res.ok) {
    return NextResponse.json({ error: "Record failed" }, { status: 502 });
  }

  return NextResponse.json({ received: true });
}
