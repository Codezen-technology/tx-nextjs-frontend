import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const base = endpoints.business.reportMatrix;
  return proxyToB2B(qs ? `${base}?${qs}` : base);
}
