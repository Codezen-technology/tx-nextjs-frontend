import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/api/auth-cookies";
import { endpoints } from "@/lib/api/endpoints";
import { getServerWpJsonBase } from "@/lib/env";

export async function POST() {
  const base = getServerWpJsonBase();
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;

  if (base && access) {
    await fetch(`${base}${endpoints.auth.logoutAll}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access}`,
      },
    }).catch(() => undefined);
  }

  clearSessionCookies(cookieStore);

  return NextResponse.json({ ok: true });
}
