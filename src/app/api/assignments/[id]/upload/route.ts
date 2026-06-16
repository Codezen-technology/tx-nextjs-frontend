import { NextResponse } from "next/server";
import { proxyFormDataToWP } from "@/lib/api/bff";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing assignment id" }, { status: 400 });
  }
  const formData = await req.formData();
  return proxyFormDataToWP(`/assignments/${encodeURIComponent(id)}/upload`, formData);
}
