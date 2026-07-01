import { NextResponse } from "next/server";
import { getServerWpJsonBase, env } from "@/lib/env";

/**
 * Certificate Stripe-direct payment intent (Option C — no WooCommerce).
 *
 * Server-authoritative: the amount comes from the plugin's `/certificate/quote`
 * (which re-prices every choice against Gravity Form 4) — the client-sent price
 * is never trusted. Order fields are stashed in the PaymentIntent metadata so the
 * webhook can record the GF entry + email on `payment_intent.succeeded`.
 *
 * @see docs/CERTIFICATE_PAGE_PLAN.md
 */

interface CertSelection {
  products?: Record<string, { choice: string; qty: number }>;
  shipping?: string | null;
}

interface CertIntentBody extends CertSelection {
  /** Dynamic GF field values keyed by input name (input_6, input_78_1, …). */
  fields?: Record<string, string>;
  /** Derived contact for the email requirement + confirmation email. */
  contact?: { email?: string; name?: string };
}

interface Quote {
  available: boolean;
  currency: string;
  total: number;
  total_minor: number;
}

/** Authoritative quote from the plugin (prices sourced from GF form 4). */
async function fetchQuote(selection: CertSelection): Promise<Quote | null> {
  const res = await fetch(`${getServerWpJsonBase()}/lms-backend/v1/certificate/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      products: selection.products ?? {},
      shipping: selection.shipping ?? null,
    }),
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as { success?: boolean; data?: Quote } | null;
  if (!res.ok || !json?.success || !json.data) return null;
  return json.data;
}

async function createPaymentIntent(
  amountMinor: number,
  currency: string,
  metadata: Record<string, string>,
): Promise<{ id: string; client_secret: string } | null> {
  if (!env.STRIPE_SECRET_KEY) return null;

  const params = new URLSearchParams({
    amount: String(amountMinor),
    currency: currency.toLowerCase(),
    "payment_method_types[]": "card",
  });
  for (const [k, v] of Object.entries(metadata)) {
    // Stripe metadata: max 50 keys, 500 chars each.
    params.set(`metadata[${k}]`, v.slice(0, 500));
  }

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });

  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as { id: string; client_secret: string };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: CertIntentBody;
  try {
    body = (await req.json()) as CertIntentBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.contact?.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const quote = await fetchQuote({ products: body.products, shipping: body.shipping });
  if (!quote?.available) {
    return NextResponse.json({ error: "Certificate ordering is unavailable" }, { status: 503 });
  }
  if (quote.total_minor <= 0) {
    return NextResponse.json({ error: "Select at least one certificate option" }, { status: 400 });
  }

  // Stash the order for the record step (confirm + webhook forward this metadata).
  // Dynamic GF field values go in as `f_<inputname>` — one key each, so no single
  // value is truncated (Stripe caps each metadata value at 500 chars).
  const metadata: Record<string, string> = {
    cert_email: email,
    cert_name: body.contact?.name ?? "",
    cert_total_minor: String(quote.total_minor),
    cert_selection: JSON.stringify({
      products: body.products ?? {},
      shipping: body.shipping ?? null,
    }),
  };
  for (const [name, value] of Object.entries(body.fields ?? {})) {
    if (typeof value === "string" && value !== "") {
      metadata[`f_${name}`] = value.slice(0, 500);
    }
  }

  const intent = await createPaymentIntent(quote.total_minor, quote.currency, metadata);
  if (!intent?.client_secret) {
    return NextResponse.json({ error: "Stripe is not configured on the server" }, { status: 503 });
  }

  return NextResponse.json({
    client_secret: intent.client_secret,
    payment_intent_id: intent.id,
    total: quote.total,
    total_minor: quote.total_minor,
    currency: quote.currency,
  });
}
