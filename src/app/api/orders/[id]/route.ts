import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

interface RouteContext {
  params: { id: string };
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  return proxyToWP(`/orders/${encodeURIComponent(id)}`, { requiresAuth: false });
}
