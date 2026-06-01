import { ApiError } from "@/lib/api/error";
import { decodeEntities } from "@/lib/api/parsers";

export async function bffJson<T>(path: string, init?: RequestInit): Promise<T> {
  const extraHeaders = (init?.headers ?? {}) as Record<string, string>;
  const headers: Record<string, string> = { ...extraHeaders };
  if (init?.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers,
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = {};
    }
  }
  if (!res.ok) {
    const rawMessage =
      (typeof data.error === "string" ? data.error : null) ??
      (typeof data.message === "string" ? data.message : null) ??
      "Request failed";
    const code = typeof data.code === "string" ? data.code : "request_failed";
    throw new ApiError({
      status: res.status,
      code,
      message: decodeEntities(rawMessage),
      raw: data,
    });
  }
  return data as T;
}

export function hasUserLoggedInCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith("user_logged_in=1"));
}

// ─── Cart-Token management (WC Store API session) ─────────────────────────────

const CART_TOKEN_KEY = "wc-cart-token";
const CART_NONCE_KEY = "wc-cart-nonce";

export function getCartToken(): { cartToken: string; nonce: string } | null {
  if (typeof window === "undefined") return null;
  const cartToken = localStorage.getItem(CART_TOKEN_KEY);
  if (!cartToken) return null;
  return { cartToken, nonce: localStorage.getItem(CART_NONCE_KEY) ?? "" };
}

export function saveCartToken(cartToken: string, nonce: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_TOKEN_KEY, cartToken);
  localStorage.setItem(CART_NONCE_KEY, nonce);
}

export function clearCartToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_TOKEN_KEY);
  localStorage.removeItem(CART_NONCE_KEY);
}

/** fetch wrapper for WC Store API BFF cart routes — attaches and refreshes Cart-Token. */
export async function cartFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // WC Store API requires Cart-Token for write operations. Bootstrap it via GET /cart
  // if no token is present yet (e.g. first "Add to Basket" before cart page was visited).
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET" && !getCartToken()) {
    const bootstrap = await fetch("/api/cart", { credentials: "include" });
    const bt = bootstrap.headers.get("x-cart-token");
    const bn = bootstrap.headers.get("x-wc-store-api-nonce");
    if (bt) saveCartToken(bt, bn ?? "");
  }

  const token = getCartToken();
  if (token) {
    headers["x-cart-token"] = token.cartToken;
    headers["x-wc-store-api-nonce"] = token.nonce;
  }

  const res = await fetch(path, { ...init, credentials: "include", headers });

  // Persist any updated Cart-Token the BFF echoed back.
  const newToken = res.headers.get("x-cart-token");
  const newNonce = res.headers.get("x-wc-store-api-nonce");
  if (newToken) saveCartToken(newToken, newNonce ?? "");

  const text = await res.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = {};
    }
  }
  if (!res.ok) {
    // WC Store API embeds the authoritative current cart in data.cart on operation errors
    // (e.g. woocommerce_rest_cart_invalid_key when session/key is stale).
    // Use it directly so the client syncs to real server state instead of rolling back to a snapshot.
    const embedded = (data as { data?: { cart?: unknown } }).data?.cart;
    if (embedded) {
      // Stale session — drop the cached token so the next write bootstraps a fresh one
      if (data.code === "woocommerce_rest_cart_invalid_key") clearCartToken();
      return embedded as T;
    }

    const rawMessage =
      (typeof data.error === "string" ? data.error : null) ??
      (typeof data.message === "string" ? data.message : null) ??
      "Cart request failed";
    const code = typeof data.code === "string" ? data.code : "cart_error";
    throw new ApiError({
      status: res.status,
      code,
      message: decodeEntities(rawMessage),
      raw: data,
    });
  }
  return data as T;
}
