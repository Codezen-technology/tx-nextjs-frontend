import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id?.trim()) return NextResponse.json({ error: "Missing quiz id" }, { status: 400 });
  return proxyToWP(`/quizzes/${encodeURIComponent(id)}/results`);
}
