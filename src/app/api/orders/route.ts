import { NextResponse } from "next/server";
import { proxyToWCRest } from "@/lib/api/bff";
import {
  createWCOrder,
  getAuthenticatedUserId,
  setGuestOrderKeyCookie,
  validateCouponCode,
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
  /** @deprecated Use coupon_code + discount_total — WC REST coupon_lines returns an empty body. */
  coupon_lines?: Array<{ code: string }>;
  coupon_code?: string;
  /** Cart discount total (from Store API), applied via fee_lines on the WC order. */
  discount_total?: number;
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

  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as { id: string; client_secret: string };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: CreateOrderBody;
  try {
    body = (await req.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const lineItems = body.line_items?.filter((li) => li.product_id > 0 && li.quantity > 0);
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

  const userId = await getAuthenticatedUserId();

  const couponCode = body.coupon_code?.trim() || body.coupon_lines?.[0]?.code?.trim() || "";
  const discountTotal =
    typeof body.discount_total === "number" && body.discount_total > 0 ? body.discount_total : 0;

  if (couponCode) {
    const couponError = await validateCouponCode(couponCode);
    if (couponError) {
      return NextResponse.json({ error: couponError }, { status: 400 });
    }
  }

  const wcPayload: Record<string, unknown> = {
    set_paid: false,
    status: "pending",
    payment_method: body.payment_method ?? "stripe",
    payment_method_title: body.payment_method_title ?? "Credit/Debit Card",
    billing: body.billing,
    shipping: body.shipping ?? body.billing,
    line_items: lineItems,
    customer_note: body.customer_note ?? "",
  };

  // WC REST coupon_lines triggers a plugin bug: HTTP 200 with an empty body.
  if (couponCode && discountTotal > 0) {
    wcPayload.fee_lines = [
      {
        name: `Discount (${couponCode})`,
        total: `-${discountTotal.toFixed(2)}`,
        tax_status: "none",
      },
    ];
  }

  if (userId) {
    wcPayload.customer_id = userId;
  }

  const wcResult = await createWCOrder(wcPayload);
  if (!wcResult.ok) {
    return NextResponse.json({ error: wcResult.error }, { status: 502 });
  }
  const wcOrder = wcResult.order;

  if (!userId && wcOrder.order_key) {
    await setGuestOrderKeyCookie(wcOrder.id, wcOrder.order_key);
  }

  const amountPence = Math.round(parseFloat(wcOrder.total) * 100);
  const intent = await createStripePaymentIntent(amountPence, wcOrder.currency, wcOrder.id);

  if (!intent?.client_secret) {
    return NextResponse.json({ error: "Stripe is not configured on the server" }, { status: 503 });
  }

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
  const userId = await getAuthenticatedUserId();
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
