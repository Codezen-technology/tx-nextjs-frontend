import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { endpoints } from "@/lib/api/endpoints";
import { getServerWpJsonBase } from "@/lib/env";

export async function POST() {
  const base = getServerWpJsonBase();
  const cookieStore = cookies();
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

  // Always clear cookies regardless of WP response
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("user_logged_in");

  return NextResponse.json({ ok: true });
}
