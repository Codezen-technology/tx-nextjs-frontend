import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing unit id" }, { status: 400 });
  }
  const courseId = new URL(req.url).searchParams.get("course_id");
  if (!courseId) {
    return NextResponse.json({ error: "Missing course_id" }, { status: 400 });
  }
  return proxyToWP(
    `/units/${encodeURIComponent(id)}/player-content?course_id=${encodeURIComponent(courseId)}`,
  );
}
