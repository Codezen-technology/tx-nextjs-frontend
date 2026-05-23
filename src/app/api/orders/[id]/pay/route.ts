import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

interface RouteContext {
  params: { id: string };
}

export async function POST(req: Request, { params }: RouteContext) {
  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  return proxyToWP(`/orders/${encodeURIComponent(id)}/pay`, { method: "POST", body, requiresAuth: false });
}
