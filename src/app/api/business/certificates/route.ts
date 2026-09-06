import { proxyToB2BQuery } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function GET(req: Request) {
  return proxyToB2BQuery(req, endpoints.business.certificates);
}
