import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env, getServerWpJsonBase } from "@/lib/env";

export async function POST(req: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = getServerWpJsonBase();
  if (!base) {
    return NextResponse.json({ error: "WP API URL not configured" }, { status: 503 });
  }

  const formData = await req.formData();
  const url = `${base}/${env.LMS_NAMESPACE}/users/me/avatar`.replace(/([^:]\/)\/+/g, "$1");

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const text = await res.text();
  let json: { success?: boolean; data?: { avatar?: string }; message?: string };
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "Invalid response from WordPress" }, { status: 502 });
  }

  if (json.success && json.data) {
    return NextResponse.json(json.data, { status: res.status });
  }

  return NextResponse.json(
    { error: json.message ?? "Upload failed" },
    { status: res.status >= 400 ? res.status : 400 },
  );
}
