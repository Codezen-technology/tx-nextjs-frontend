import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { endpoints } from "@/lib/api/endpoints";
import { sanitizeWpErrorMessage } from "@/lib/api/error";
import { getServerWpJsonBase } from "@/lib/env";

type CheckoutSessionBody = {
  order_id?: number;
  order_key?: string;
};

type WpCheckoutSessionData = {
  auto_login?: boolean;
  account_exists?: boolean;
  email?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: Record<string, unknown>;
};

function formatUser(u: Record<string, unknown>) {
  const displayName =
    (typeof u.display_name === "string" && u.display_name) ||
    (typeof u.name === "string" && u.name) ||
    (typeof u.user_nicename === "string" && u.user_nicename) ||
    "";
  const email = typeof u.email === "string" ? u.email : "";
  const nicename =
    (typeof u.user_nicename === "string" && u.user_nicename) ||
    (typeof u.username === "string" && u.username) ||
    "";

  return { email, displayName, nicename };
}

export async function POST(request: Request) {
  const base = getServerWpJsonBase();
  if (!base) {
    return NextResponse.json({ error: "WordPress API URL is not configured" }, { status: 500 });
  }

  let body: CheckoutSessionBody;
  try {
    body = (await request.json()) as CheckoutSessionBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const orderId = Number(body.order_id);
  const orderKey = typeof body.order_key === "string" ? body.order_key.trim() : "";

  if (!Number.isFinite(orderId) || orderId <= 0 || !orderKey) {
    return NextResponse.json({ error: "order_id and order_key are required" }, { status: 400 });
  }

  let wpRes: Response;
  let json: { success?: boolean; data?: WpCheckoutSessionData; message?: string };

  try {
    wpRes = await fetch(`${base}${endpoints.auth.checkoutSession}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, order_key: orderKey }),
    });
    json = await wpRes.json();
  } catch {
    return NextResponse.json({ error: "Checkout session service unavailable" }, { status: 502 });
  }

  if (!wpRes.ok || json.success === false || !json.data) {
    return NextResponse.json(
      {
        error: sanitizeWpErrorMessage(json.message, "Could not verify checkout session."),
      },
      { status: wpRes.ok ? 403 : wpRes.status },
    );
  }

  const data = json.data;

  if (!data.auto_login) {
    return NextResponse.json({
      auto_login: false,
      account_exists: Boolean(data.account_exists),
      email: typeof data.email === "string" ? data.email : undefined,
    });
  }

  if (!data.access_token) {
    return NextResponse.json({ error: "Auto-login failed" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const maxAge = typeof data.expires_in === "number" ? data.expires_in : 86400;

  cookieStore.set("access_token", data.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  if (data.refresh_token) {
    cookieStore.set("refresh_token", data.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
  }

  cookieStore.set("user_logged_in", "1", {
    httpOnly: false,
    secure,
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  const user = formatUser(data.user ?? {});

  return NextResponse.json({
    auto_login: true,
    account_exists: false,
    user,
  });
}
