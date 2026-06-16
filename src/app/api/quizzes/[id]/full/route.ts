import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing quiz id" }, { status: 400 });
  }
  const courseId = new URL(req.url).searchParams.get("course_id") ?? "";
  const qs = courseId ? `?course_id=${encodeURIComponent(courseId)}` : "";
  return proxyToWP(`/quizzes/${encodeURIComponent(id)}/full${qs}`);
}
