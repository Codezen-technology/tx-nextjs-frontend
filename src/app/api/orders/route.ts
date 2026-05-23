import { NextResponse } from "next/server";
import { proxyToWCRest } from "@/lib/api/bff";
import {
  createWCOrder,
  getAuthenticatedUserId,
  setGuestOrderKeyCookie,
  validateLineItems,
  wcBasicAuthHeader,
} from "@/lib/api/wc-orders";
import { env } from "@/lib/env";

interface CreateOrderBody {
  payment_method?: string;
  payment_method_title?: string;
  billing?: Record<string, string>;
  shipping?: Record<string, string>;
  line_items?: Array<{ product_id: number; quantity: number }>;
  coupon_lines?: Array<{ code: string }>;
  customer_note?: string;
}

async function createStripePaymentIntent(
  amountPence: number,
  currency: string,
  wcOrderId: number,
): Promise<{ id: string; client_secret: string } | null> {
  if (!env.STRIPE_SECRET_KEY) return null;

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      amount: String(amountPence),
      currency: currency.toLowerCase(),
      "payment_method_types[]": "card",
      "metadata[wc_order_id]": String(wcOrderId),
    }).toString(),
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json() as Promise<{ id: string; client_secret: string }>;
}

export async function POST(req: Request) {
  let body: CreateOrderBody;
  try {
    body = (await req.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const lineItems = body.line_items?.filter(
    (li) => li.product_id > 0 && li.quantity > 0,
  );
  if (!lineItems?.length) {
    return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });
  }

  if (!body.billing?.email?.trim()) {
    return NextResponse.json({ error: "Billing email is required" }, { status: 400 });
  }

  try {
    wcBasicAuthHeader();
  } catch {
    return NextResponse.json({ error: "WooCommerce is not configured" }, { status: 503 });
  }

  const productError = await validateLineItems(lineItems);
  if (productError) {
    return NextResponse.json({ error: productError }, { status: 400 });
  }

  const userId = getAuthenticatedUserId();

  const wcPayload: Record<string, unknown> = {
    set_paid: false,
    status: "pending",
    payment_method: body.payment_method ?? "stripe",
    payment_method_title: body.payment_method_title ?? "Credit/Debit Card",
    billing: body.billing,
    shipping: body.shipping ?? body.billing,
    line_items: lineItems,
    coupon_lines: body.coupon_lines ?? [],
    customer_note: body.customer_note ?? "",
  };

  if (userId) {
    wcPayload.customer_id = userId;
  }

  const wcOrder = await createWCOrder(wcPayload);
  if (!wcOrder) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 502 });
  }

  if (!userId && wcOrder.order_key) {
    setGuestOrderKeyCookie(wcOrder.id, wcOrder.order_key);
  }

  const amountPence = Math.round(parseFloat(wcOrder.total) * 100);
  const intent = await createStripePaymentIntent(amountPence, wcOrder.currency, wcOrder.id);

  return NextResponse.json({
    order_id: wcOrder.id,
    order_key: wcOrder.order_key,
    status: wcOrder.status,
    total: parseFloat(wcOrder.total),
    currency: wcOrder.currency,
    client_secret: intent?.client_secret ?? null,
    payment_intent_id: intent?.id ?? null,
  });
}

export async function GET(req: Request) {
  const userId = getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  return proxyToWCRest("/orders", {
    query: {
      customer: userId,
      page: searchParams.get("page") ?? "1",
      per_page: searchParams.get("per_page") ?? "10",
      status: searchParams.get("status") ?? undefined,
      orderby: "date",
      order: "desc",
    },
  });
}
