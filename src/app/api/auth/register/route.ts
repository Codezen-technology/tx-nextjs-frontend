import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { endpoints } from "@/lib/api/endpoints";
import { getServerWpJsonBase } from "@/lib/env";

export async function POST(request: Request) {
  const base = getServerWpJsonBase();
  if (!base) {
    return NextResponse.json({ error: "WordPress API URL is not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
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
    wpRes = await fetch(`${base}${endpoints.auth.register}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    json = await wpRes.json();
  } catch {
    return NextResponse.json({ error: "Registration service unavailable" }, { status: 502 });
  }

  if (!wpRes.ok || json.success === false) {
    return NextResponse.json(
      { error: json.message ?? "Registration failed" },
      { status: wpRes.ok ? 400 : wpRes.status },
    );
  }

  const data = json.data;
  if (data?.access_token) {
    const cookieStore = cookies();
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
  }

  const u = json.data?.user ?? {};
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

  return NextResponse.json({
    user: { email, displayName, nicename },
  });
}
