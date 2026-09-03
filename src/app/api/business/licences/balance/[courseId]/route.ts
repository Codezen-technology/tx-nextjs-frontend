import { proxyToB2B } from "@/lib/api/bff";

export async function GET(_req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return proxyToB2B(`/licences/balance/${encodeURIComponent(courseId)}`);
}
