import { NextResponse } from "next/server";
import { proxyToWCStore } from "@/lib/api/bff";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Pay an existing WooCommerce order via the WC Store API checkout-order endpoint
 * (`POST /wc/store/v1/checkout/{id}`). Generic — used by the global order-pay
 * checkout page for B2B licences/subscriptions and retry-pay of any pending order.
 *
 * The order must already exist (created server-side); the caller passes its `key`
 * for authorization. Cart-Token / Nonce are forwarded by proxyToWCStore, and the
 * httpOnly JWT is attached for the logged-in customer.
 */
export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  return proxyToWCStore(`/checkout/${orderId}`, { method: "POST", body, request: req });
}
