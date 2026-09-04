import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const path = qs ? `${endpoints.business.assignments}?${qs}` : endpoints.business.assignments;
  return proxyToB2B(path);
}
