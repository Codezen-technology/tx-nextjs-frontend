import { NextResponse } from "next/server";
import { proxyToWCStore } from "@/lib/api/bff";
import { withStoreApiAttribution } from "@/lib/analytics/order-attribution";
import { readAttributionState } from "@/lib/analytics/attribution-cookies";
import { pixelYourSiteQuery } from "@/lib/analytics/pixelyoursite";

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

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // PixelYourSite rewrites its order data on this hook with no double-execution
  // guard, rebuilding it from `$_REQUEST`. Sending the parameters here too stops
  // a retry-pay clobbering a record that was already populated at create time.
  const pys = pixelYourSiteQuery(readAttributionState(req.headers.get("cookie")));

  return proxyToWCStore(`/checkout/${orderId}${pys}`, {
    method: "POST",
    body: withStoreApiAttribution(body, req),
    request: req,
  });
}
