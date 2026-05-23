import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

interface RouteContext {
  params: { code: string };
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const { code } = params;
  if (!code) return NextResponse.json({ error: "Missing coupon code" }, { status: 400 });
  return proxyToWP(`/cart/coupon/${encodeURIComponent(code)}`, { method: "DELETE", requiresAuth: false, wcSession: true, request: req });
}
