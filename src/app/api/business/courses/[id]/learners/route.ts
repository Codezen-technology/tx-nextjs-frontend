import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const base = endpoints.business.courseLearners(id);
  const path = qs ? `${base}?${qs}` : base;
  return proxyToB2B(path);
}
