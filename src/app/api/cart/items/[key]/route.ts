import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

interface RouteContext {
  params: { key: string };
}

export async function PUT(req: Request, { params }: RouteContext) {
  const { key } = params;
  if (!key) return NextResponse.json({ error: "Missing cart item key" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  return proxyToWP(`/cart/items/${encodeURIComponent(key)}`, { method: "PUT", body, requiresAuth: false, wcSession: true, request: req });
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const { key } = params;
  if (!key) return NextResponse.json({ error: "Missing cart item key" }, { status: 400 });
  return proxyToWP(`/cart/items/${encodeURIComponent(key)}`, { method: "DELETE", requiresAuth: false, wcSession: true, request: req });
}
