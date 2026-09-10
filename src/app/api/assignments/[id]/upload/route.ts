import { NextResponse } from "next/server";
import { proxyFormDataToWP, readFormData } from "@/lib/api/bff";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing assignment id" }, { status: 400 });
  }
  const formData = await readFormData(req);
  if (!formData) {
    return NextResponse.json(
      { error: "Expected multipart form data", code: "invalid_body" },
      { status: 400 },
    );
  }
  return proxyFormDataToWP(`/assignments/${encodeURIComponent(id)}/upload`, formData);
}
