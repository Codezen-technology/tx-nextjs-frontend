import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env, getServerWpJsonBase } from "@/lib/env";

// ─── URL builders ─────────────────────────────────────────────────────────────

function wcStoreUrl(path: string): string {
  const base = getServerWpJsonBase();
  if (!base) throw new Error("WP API URL not configured");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}/wc/store/v1${p}`.replace(/([^:]\/)\/+/g, "$1");
}

function wcRestUrl(path: string): string {
  const base = getServerWpJsonBase();
  if (!base) throw new Error("WP API URL not configured");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}/wc/v3${p}`.replace(/([^:]\/)\/+/g, "$1");
}

function wcBasicAuth(): string {
  const creds = `${env.WC_CONSUMER_KEY}:${env.WC_CONSUMER_SECRET}`;
  return `Basic ${Buffer.from(creds).toString("base64")}`;
}

/** Decode JWT payload without verification (WP already verified it). */
export function getUserIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) as {
      data?: { user?: { id?: number } };
    };
    return payload.data?.user?.id ?? null;
  } catch {
    return null;
  }
}

// ─── WC Store API proxy (cart operations) ─────────────────────────────────────

type WCStoreOptions = {
  method?: string;
  body?: unknown;
  /** Incoming Next.js Request — used to forward Cart-Token / Nonce. */
  request?: Request;
};

export async function proxyToWCStore(
  wcPath: string,
  options: WCStoreOptions = {},
): Promise<NextResponse> {
  const { method = "GET", body, request } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // Forward Cart-Token + Nonce sent by the browser.
  if (request) {
    const cartToken = request.headers.get("x-cart-token");
    const nonce = request.headers.get("x-wc-store-api-nonce");
    if (cartToken) headers["Cart-Token"] = cartToken;
    if (nonce) headers["Nonce"] = nonce;
  }

  // Attach JWT for logged-in user cart association.
  const cookieStore = await cookies();
  const jwt = cookieStore.get("access_token")?.value;
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

  const url = wcStoreUrl(wcPath);
  const fetchBody = body !== undefined ? JSON.stringify(body) : undefined;

  const res = await fetch(url, { method, headers, body: fetchBody });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "Invalid response from WooCommerce" }, { status: 502 });
  }

  const nextRes =
    res.status === 204
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json(json, { status: res.status });

  // Echo Cart-Token + Nonce back so the browser can persist them.
  const newCartToken = res.headers.get("cart-token");
  const newNonce = res.headers.get("nonce");
  if (newCartToken) nextRes.headers.set("x-cart-token", newCartToken);
  if (newNonce) nextRes.headers.set("x-wc-store-api-nonce", newNonce);

  return nextRes;
}

// ─── WC REST API v3 proxy (orders, payment gateways) ──────────────────────────

type WCRestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
};

export async function proxyToWCRest(
  wcPath: string,
  options: WCRestOptions = {},
): Promise<NextResponse> {
  const { method = "GET", body, query } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: wcBasicAuth(),
  };

  let url = wcRestUrl(wcPath);
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url = `${url}?${qs}`;
  }

  const fetchBody = body !== undefined ? JSON.stringify(body) : undefined;
  const res = await fetch(url, { method, headers, body: fetchBody });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "Invalid response from WooCommerce" }, { status: 502 });
  }

  const nextRes = NextResponse.json(json, { status: res.status });

  // Forward WP pagination headers.
  const total = res.headers.get("x-wp-total");
  const totalPages = res.headers.get("x-wp-totalpages");
  if (total) nextRes.headers.set("x-wp-total", total);
  if (totalPages) nextRes.headers.set("x-wp-totalpages", totalPages);

  return nextRes;
}

type ProxyOptions = {
  method?: string;
  body?: unknown;
  requiresAuth?: boolean;
  /** Forward WooCommerce guest session cookie through the BFF. */
  wcSession?: boolean;
  /** Incoming Request — required when wcSession is true. */
  request?: Request;
  /** Override the WP REST namespace (defaults to env.LMS_NAMESPACE, e.g. lms-backend/v1). */
  namespace?: string;
};

function wpJsonUrl(path: string, namespace: string = env.LMS_NAMESPACE): string {
  const base = getServerWpJsonBase();
  if (!base) throw new Error("WP API URL is not configured (NEXT_PUBLIC_WP_API_URL or WP_API_URL)");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}/${namespace}${p}`.replace(/([^:]\/)\/+/g, "$1");
}

async function tryRefresh(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (!refreshToken) return null;

  const res = await fetch(wpJsonUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    cookieStore.delete("user_logged_in");
    return null;
  }

  const json = (await res.json()) as {
    success?: boolean;
    data?: { access_token?: string; refresh_token?: string; expires_in?: number };
  };
  if (!json.success || !json.data?.access_token) return null;

  const { access_token, refresh_token, expires_in } = json.data;
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set("access_token", access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: expires_in ?? 86400,
    path: "/",
  });
  if (refresh_token) {
    cookieStore.set("refresh_token", refresh_token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
  }

  return access_token;
}

export async function proxyToWP(wpPath: string, options: ProxyOptions = {}): Promise<NextResponse> {
  const {
    method = "GET",
    body,
    requiresAuth = true,
    wcSession = false,
    request,
    namespace = env.LMS_NAMESPACE,
  } = options;
  const cookieStore = await cookies();

  const accessFromCookie = cookieStore.get("access_token")?.value;

  if (requiresAuth && !accessFromCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessFromCookie) headers.Authorization = `Bearer ${accessFromCookie}`;

  // Forward the WooCommerce guest session cookie so PHP session state persists across requests.
  if (wcSession && request) {
    const incoming = request.headers.get("cookie") ?? "";
    const wcCookie = incoming
      .split(";")
      .map((s) => s.trim())
      .find((s) => /^woocommerce_session_/.test(s));
    if (wcCookie) headers["Cookie"] = wcCookie;
  }

  const url = wpJsonUrl(wpPath.startsWith("/") ? wpPath : `/${wpPath}`, namespace);
  const fetchBody = body !== undefined ? JSON.stringify(body) : undefined;

  let res = await fetch(url, { method, headers, body: fetchBody });

  if (res.status === 401 && requiresAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.Authorization = `Bearer ${refreshed}`;
      res = await fetch(url, { method, headers, body: fetchBody });
    }
  }

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "Invalid response from WordPress" }, { status: 502 });
  }

  const envelope = json as {
    success?: boolean;
    data?: unknown;
    message?: string;
    code?: string;
    error?: { message?: string; code?: string };
  };

  let nextRes: NextResponse;

  if (envelope.success === true) {
    nextRes = NextResponse.json(envelope.data ?? null, { status: res.status });
  } else if (envelope.success === false) {
    const msg = envelope.message ?? envelope.error?.message ?? "Request failed";
    const code = envelope.code ?? envelope.error?.code ?? "error";
    nextRes = NextResponse.json({ error: msg, code }, { status: res.status });
  } else {
    nextRes = NextResponse.json(json, { status: res.status });
  }

  // Echo the WooCommerce session cookie back to the browser (guest cart persistence).
  if (wcSession) {
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) nextRes.headers.set("set-cookie", setCookie);
  }

  return nextRes;
}

/** Proxy to the B2B business dashboard namespace (`lms-b2b/v1` by default). */
export async function proxyToB2B(
  wpPath: string,
  options: Omit<ProxyOptions, "namespace"> = {},
): Promise<NextResponse> {
  return proxyToWP(wpPath, { ...options, namespace: env.B2B_NAMESPACE });
}

/**
 * Proxy a multipart/form-data request (e.g. assignment file uploads) to the LMS
 * backend. Mirrors proxyToWP's auth (httpOnly access_token → Bearer, refresh on
 * 401) but streams the raw FormData instead of JSON. Content-Type is left unset
 * so fetch derives the correct multipart boundary.
 */
export async function proxyFormDataToWP(
  wpPath: string,
  formData: FormData,
  options: { namespace?: string } = {},
): Promise<NextResponse> {
  const { namespace = env.LMS_NAMESPACE } = options;
  const cookieStore = await cookies();
  const accessFromCookie = cookieStore.get("access_token")?.value;

  if (!accessFromCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = wpJsonUrl(wpPath.startsWith("/") ? wpPath : `/${wpPath}`, namespace);

  const doFetch = (token: string) =>
    fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

  let res = await doFetch(accessFromCookie);

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) res = await doFetch(refreshed);
  }

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "Invalid response from WordPress" }, { status: 502 });
  }

  const envelope = json as {
    success?: boolean;
    data?: unknown;
    message?: string;
    code?: string;
    error?: { message?: string; code?: string };
  };

  if (envelope.success === true) {
    return NextResponse.json(envelope.data ?? null, { status: res.status });
  }
  if (envelope.success === false) {
    const msg = envelope.message ?? envelope.error?.message ?? "Upload failed";
    const code = envelope.code ?? envelope.error?.code ?? "error";
    return NextResponse.json({ error: msg, code }, { status: res.status });
  }
  return NextResponse.json(json, { status: res.status });
}
