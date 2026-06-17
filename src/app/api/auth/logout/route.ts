import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { endpoints } from "@/lib/api/endpoints";
import { getServerWpJsonBase } from "@/lib/env";

export async function POST() {
  const base = getServerWpJsonBase();
  const cookieStore = await cookies();
  const refresh = cookieStore.get("refresh_token")?.value;
  const access = cookieStore.get("access_token")?.value;

  if (base && (refresh || access)) {
    await fetch(`${base}${endpoints.auth.logout}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
      body: refresh ? JSON.stringify({ refresh_token: refresh }) : undefined,
    }).catch(() => undefined);
  }

  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("user_logged_in");

  return NextResponse.json({ ok: true });
}
