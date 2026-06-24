import { NextResponse } from "next/server";
import { proxyToWCStore } from "@/lib/api/bff";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Read an existing order via the WC Store API order endpoint
 * (`GET /wc/store/v1/order/{id}?key={key}`). Customer-facing and key-authorized —
 * no WooCommerce consumer keys required — so it works for the headless order-pay
 * checkout page (line items + totals) regardless of WC REST key configuration.
 */
export async function GET(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";
  const billingEmail = url.searchParams.get("billing_email") ?? "";
  if (!key) {
    return NextResponse.json({ error: "Order key is required" }, { status: 400 });
  }

  const qs = new URLSearchParams({ key });
  if (billingEmail) qs.set("billing_email", billingEmail);

  return proxyToWCStore(`/order/${orderId}?${qs.toString()}`, { method: "GET", request: req });
}
