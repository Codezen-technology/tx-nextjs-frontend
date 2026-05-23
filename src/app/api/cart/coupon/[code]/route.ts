import { NextResponse } from "next/server";
import { proxyToWCStore } from "@/lib/api/bff";

interface RouteContext {
  params: { code: string };
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const { code } = params;
  if (!code) return NextResponse.json({ error: "Missing coupon code" }, { status: 400 });
  // WC Store API: POST /cart/remove-coupon with body { code } (not DELETE).
  return proxyToWCStore("/cart/remove-coupon", { method: "POST", body: { code }, request: req });
}
