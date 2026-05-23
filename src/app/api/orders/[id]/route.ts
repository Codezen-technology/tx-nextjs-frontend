import { NextResponse } from "next/server";
import { proxyToWCRest } from "@/lib/api/bff";
import {
  canAccessOrder,
  fetchWCOrder,
  getAuthenticatedUserId,
  getGuestOrderKeyFromCookies,
} from "@/lib/api/wc-orders";

interface RouteContext {
  params: { id: string };
}

function parseOrderId(id: string): number | null {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function resolveOrderKey(req: Request, orderId: number): string | null {
  const fromQuery = new URL(req.url).searchParams.get("key");
  if (fromQuery) return fromQuery;
  return getGuestOrderKeyFromCookies(orderId);
}

export async function GET(req: Request, { params }: RouteContext) {
  const orderId = parseOrderId(params.id);
  if (!orderId) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const order = await fetchWCOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const userId = getAuthenticatedUserId();
  const orderKey = resolveOrderKey(req, orderId);

  if (!canAccessOrder(order, userId, orderKey)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return proxyToWCRest(`/orders/${orderId}`);
}

/** Status updates are not exposed to the browser — use POST /api/orders/{id}/pay after Stripe confirms. */
export async function PUT() {
  return NextResponse.json(
    { error: "Order status cannot be updated from the client" },
    { status: 403 },
  );
}
