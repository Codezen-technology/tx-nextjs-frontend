import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

interface RouteContext {
  params: Promise<{ courseId: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { courseId: id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing course id" }, { status: 400 });
  }
  return proxyToWP(`/users/me/courses/${encodeURIComponent(id)}/progress`);
}
