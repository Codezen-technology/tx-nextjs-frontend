import { proxyToB2B, proxyToB2BQuery } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function GET(req: Request) {
  return proxyToB2BQuery(req, endpoints.business.team);
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyToB2B(endpoints.business.team, { method: "POST", body });
}
