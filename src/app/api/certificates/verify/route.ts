import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  if (!body?.code?.trim()) {
    return NextResponse.json({ error: "Missing certificate code" }, { status: 400 });
  }
  return proxyToWP("/certificates/verify", { method: "POST", body: { code: body.code.trim() } });
}
