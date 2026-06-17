import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing unit id" }, { status: 400 });
  }
  return proxyToWP(`/units/${encodeURIComponent(id)}/complete`, { method: "POST" });
}
