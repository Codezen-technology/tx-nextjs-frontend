import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isFinite(courseId) || courseId <= 0) {
    return NextResponse.json({ error: "Missing course id" }, { status: 400 });
  }

  const res = await proxyToWP("/reviews/my-reviews");
  if (!res.ok) return res;

  const json = (await res.json()) as {
    data?: Array<{
      course_id?: number;
      comment_ID?: string;
      review?: string;
      title?: string;
      rating?: string;
    }>;
    success?: boolean;
  };

  const items = Array.isArray(json.data) ? json.data : [];
  const mine = items.find((r) => r.course_id === courseId) ?? null;

  return NextResponse.json({ success: true, data: mine });
}
