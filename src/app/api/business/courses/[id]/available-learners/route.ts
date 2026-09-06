import { proxyToB2BQuery } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToB2BQuery(req, endpoints.business.availableLearners(id));
}
