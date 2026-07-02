import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieOptions, normalizeAuthUser, setSessionCookies } from "@/lib/api/auth-cookies";
import { endpoints } from "@/lib/api/endpoints";
import { sanitizeWpErrorMessage } from "@/lib/api/error";
import { getServerWpJsonBase } from "@/lib/env";

export async function POST(request: Request) {
  const base = getServerWpJsonBase();
  if (!base) {
    return NextResponse.json({ error: "WordPress API URL is not configured" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email?: unknown }).email === "string"
      ? (body as { email: string }).email.trim()
      : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  let wpRes: Response;
  let json: {
    success?: boolean;
    data?: {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      user?: Record<string, unknown>;
    };
    message?: string;
  };

  try {
    wpRes = await fetch(`${base}${endpoints.auth.switchUser}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access}`,
      },
      body: JSON.stringify({ email }),
    });
    json = await wpRes.json();
  } catch {
    return NextResponse.json({ error: "Switch user service unavailable" }, { status: 502 });
  }

  if (!wpRes.ok || json.success === false || !json.data?.access_token) {
    return NextResponse.json(
      { error: sanitizeWpErrorMessage(json.message, "Could not switch to that user.") },
      { status: wpRes.ok ? 403 : wpRes.status },
    );
  }

  const origAccess = cookieStore.get("access_token")?.value;
  const origRefresh = cookieStore.get("refresh_token")?.value;
  if (origAccess) {
    cookieStore.set("orig_access_token", origAccess, {
      ...authCookieOptions(7 * 24 * 60 * 60),
      httpOnly: true,
    });
  }
  if (origRefresh) {
    cookieStore.set("orig_refresh_token", origRefresh, {
      ...authCookieOptions(7 * 24 * 60 * 60),
      httpOnly: true,
    });
  }

  const { access_token, refresh_token, expires_in, user } = json.data;
  const maxAge = setSessionCookies(cookieStore, {
    access_token,
    refresh_token,
    expires_in,
  });

  const normalized = normalizeAuthUser(user);
  cookieStore.set("impersonating", "1", { ...authCookieOptions(maxAge), httpOnly: false });
  cookieStore.set(
    "impersonating_as",
    encodeURIComponent(normalized.displayName || normalized.email),
    {
      ...authCookieOptions(maxAge),
      httpOnly: false,
    },
  );

  return NextResponse.json({ user: normalized });
}
