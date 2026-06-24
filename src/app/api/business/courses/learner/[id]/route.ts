import { proxyToB2B } from "@/lib/api/bff";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const base = `/courses/learner/${encodeURIComponent(id)}`;
  const path = qs ? `${base}?${qs}` : base;
  return proxyToB2B(path);
}
