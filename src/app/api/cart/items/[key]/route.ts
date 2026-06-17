import { NextResponse } from "next/server";
import { proxyToWCStore } from "@/lib/api/bff";

interface RouteContext {
  params: Promise<{ key: string }>;
}

export async function PUT(req: Request, { params }: RouteContext) {
  const { key } = await params;
  if (!key) return NextResponse.json({ error: "Missing cart item key" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  return proxyToWCStore(`/cart/items/${encodeURIComponent(key)}`, {
    method: "PUT",
    body,
    request: req,
  });
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const { key } = await params;
  if (!key) return NextResponse.json({ error: "Missing cart item key" }, { status: 400 });
  return proxyToWCStore(`/cart/items/${encodeURIComponent(key)}`, {
    method: "DELETE",
    request: req,
  });
}
