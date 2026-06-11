import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

interface RouteContext {
  params: { id: string };
}

export async function GET(req: Request, { params }: RouteContext) {
  const id = params.id;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing assignment id" }, { status: 400 });
  }
  const courseId = new URL(req.url).searchParams.get("course_id") ?? "";
  const qs = courseId ? `?course_id=${encodeURIComponent(courseId)}` : "";
  return proxyToWP(`/assignments/${encodeURIComponent(id)}/full${qs}`);
}
