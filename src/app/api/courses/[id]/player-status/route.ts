import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

interface RouteContext {
  params: { id: string };
}

export async function GET(_req: Request, { params }: RouteContext) {
  const id = params.id;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing course id" }, { status: 400 });
  }
  return proxyToWP(`/courses/${encodeURIComponent(id)}/player-status`);
}
