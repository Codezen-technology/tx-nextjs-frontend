import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id?.trim()) return NextResponse.json({ error: "Missing assignment id" }, { status: 400 });
  const body = await req.json();
  return proxyToWP(`/assignments/${encodeURIComponent(id)}/submit`, { method: "POST", body });
}
