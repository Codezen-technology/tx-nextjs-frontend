import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const quizId = params.id;
  if (!quizId?.trim()) {
    return NextResponse.json({ error: "Missing quiz id" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  return proxyToWP(`/quizzes/${encodeURIComponent(quizId)}/retake`, {
    method: "POST",
    body,
  });
}
