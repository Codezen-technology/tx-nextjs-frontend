import { NextResponse } from "next/server";
import {
  canAccessOrder,
  fetchWCOrder,
  getAuthenticatedUserId,
  getGuestOrderKeyFromCookies,
  updateWCOrder,
  verifyStripePaymentForOrder,
} from "@/lib/api/wc-orders";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    payment_intent_id?: string;
    order_key?: string;
  };

  if (!body.payment_intent_id?.trim()) {
    return NextResponse.json({ error: "payment_intent_id is required" }, { status: 400 });
  }

  const order = await fetchWCOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const userId = await getAuthenticatedUserId();
  const orderKey =
    body.order_key?.trim() ||
    new URL(req.url).searchParams.get("key") ||
    (await getGuestOrderKeyFromCookies(orderId));

  if (!canAccessOrder(order, userId, orderKey)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status === "processing" || order.status === "completed") {
    return NextResponse.json(order, { status: 200 });
  }

  const verified = await verifyStripePaymentForOrder(body.payment_intent_id, order);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.reason }, { status: 402 });
  }

  const updated = await updateWCOrder(orderId, {
    status: "processing",
    set_paid: true,
    transaction_id: body.payment_intent_id,
    meta_data: [{ key: "_stripe_payment_intent_id", value: body.payment_intent_id }],
  });

  if (!updated) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 502 });
  }

  return NextResponse.json(updated, { status: 200 });
}
