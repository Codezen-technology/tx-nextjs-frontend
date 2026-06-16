import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getUserIdFromToken } from "@/lib/api/bff";
import { env, getServerWpJsonBase } from "@/lib/env";

export interface WCOrderRecord {
  id: number;
  status: string;
  order_key: string;
  currency: string;
  total: string;
  customer_id: number;
  billing?: { email?: string };
}

export function wcRestUrl(path: string): string {
  const base = getServerWpJsonBase();
  if (!base) throw new Error("WP API URL not configured");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}/wc/v3${p}`.replace(/([^:]\/)\/+/g, "$1");
}

export function wcBasicAuthHeader(): string {
  if (!env.WC_CONSUMER_KEY || !env.WC_CONSUMER_SECRET) {
    throw new Error("WooCommerce API credentials are not configured");
  }
  const creds = `${env.WC_CONSUMER_KEY}:${env.WC_CONSUMER_SECRET}`;
  return `Basic ${Buffer.from(creds).toString("base64")}`;
}

type WcJsonResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function parseWcJsonBody<T>(res: Response): Promise<WcJsonResult<T>> {
  const text = await res.text();
  if (!text.trim()) {
    return {
      ok: false,
      error: res.ok ? "Empty response from WooCommerce" : `WooCommerce error (${res.status})`,
    };
  }
  try {
    const data = JSON.parse(text) as T;
    if (!res.ok) {
      const err = data as { message?: string; code?: string };
      return {
        ok: false,
        error: err.message ?? err.code ?? `WooCommerce error (${res.status})`,
      };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Invalid response from WooCommerce" };
  }
}

export async function fetchWCOrder(orderId: number): Promise<WCOrderRecord | null> {
  const res = await fetch(wcRestUrl(`/orders/${orderId}`), {
    headers: { Authorization: wcBasicAuthHeader() },
    cache: "no-store",
  });
  const parsed = await parseWcJsonBody<WCOrderRecord>(res);
  return parsed.ok ? parsed.data : null;
}

export async function getAuthenticatedUserId(): Promise<number | null> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;
  return getUserIdFromToken(token);
}

/** Constant-time compare for WooCommerce order keys. */
export function orderKeyMatches(order: WCOrderRecord, key: string | null | undefined): boolean {
  if (!key?.trim() || !order.order_key) return false;
  const a = Buffer.from(key.trim());
  const b = Buffer.from(order.order_key);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function canAccessOrder(
  order: WCOrderRecord,
  userId: number | null,
  orderKey: string | null | undefined,
): boolean {
  if (orderKeyMatches(order, orderKey)) return true;
  if (userId !== null && userId > 0 && order.customer_id === userId) return true;
  return false;
}

export async function validateLineItems(
  items: Array<{ product_id: number; quantity: number }>,
): Promise<string | null> {
  for (const { product_id } of items) {
    const res = await fetch(wcRestUrl(`/products/${product_id}`), {
      headers: { Authorization: wcBasicAuthHeader() },
      cache: "no-store",
    });
    const parsed = await parseWcJsonBody<{ purchasable?: boolean; status?: string }>(res);
    if (!parsed.ok) {
      return `Invalid product ID: ${product_id}`;
    }
    const product = parsed.data;
    if (product.status !== "publish" || product.purchasable === false) {
      return `Product ${product_id} is not available for purchase`;
    }
  }
  return null;
}

/** WC REST coupon_lines breaks order creation (200 + empty body). Validate code only. */
export async function validateCouponCode(code: string): Promise<string | null> {
  const trimmed = code.trim();
  if (!trimmed) return "Coupon code is required";

  const res = await fetch(wcRestUrl(`/coupons?code=${encodeURIComponent(trimmed)}`), {
    headers: { Authorization: wcBasicAuthHeader() },
    cache: "no-store",
  });
  const parsed = await parseWcJsonBody<Array<{ status?: string }>>(res);
  if (!parsed.ok) return parsed.error;
  if (!parsed.data.length) return `Invalid coupon: ${trimmed}`;
  if (parsed.data[0].status !== "publish") return `Coupon is not active: ${trimmed}`;
  return null;
}

export type CreateWCOrderResult = { ok: true; order: WCOrderRecord } | { ok: false; error: string };

export async function createWCOrder(payload: unknown): Promise<CreateWCOrderResult> {
  const res = await fetch(wcRestUrl("/orders"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: wcBasicAuthHeader(),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const parsed = await parseWcJsonBody<WCOrderRecord>(res);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, order: parsed.data };
}

export async function updateWCOrder(orderId: number, body: unknown): Promise<WCOrderRecord | null> {
  const res = await fetch(wcRestUrl(`/orders/${orderId}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: wcBasicAuthHeader(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const parsed = await parseWcJsonBody<WCOrderRecord>(res);
  return parsed.ok ? parsed.data : null;
}

export async function verifyStripePaymentForOrder(
  paymentIntentId: string,
  order: WCOrderRecord,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!env.STRIPE_SECRET_KEY) {
    return { ok: false, reason: "Stripe is not configured" };
  }

  const res = await fetch(
    `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`,
    {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
      cache: "no-store",
    },
  );

  const parsed = await parseWcJsonBody<{
    status: string;
    amount: number;
    currency: string;
    metadata?: { wc_order_id?: string };
  }>(res);
  if (!parsed.ok) {
    return { ok: false, reason: "Payment intent not found" };
  }
  const pi = parsed.data;

  if (pi.status !== "succeeded") {
    return { ok: false, reason: "Payment not completed" };
  }

  if (pi.metadata?.wc_order_id !== String(order.id)) {
    return { ok: false, reason: "Payment does not match this order" };
  }

  const expectedAmount = Math.round(parseFloat(order.total) * 100);
  if (pi.amount !== expectedAmount) {
    return { ok: false, reason: "Payment amount mismatch" };
  }

  if (pi.currency.toLowerCase() !== order.currency.toLowerCase()) {
    return { ok: false, reason: "Payment currency mismatch" };
  }

  return { ok: true };
}

/** Guest checkout: store order key in an httpOnly cookie (hash only in cookie value is overkill; store key with order id). */
export async function setGuestOrderKeyCookie(orderId: number, orderKey: string): Promise<void> {
  const secure = process.env.NODE_ENV === "production";
  (await cookies()).set(`guest_order_key_${orderId}`, orderKey, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export async function getGuestOrderKeyFromCookies(orderId: number): Promise<string | null> {
  return (await cookies()).get(`guest_order_key_${orderId}`)?.value ?? null;
}
