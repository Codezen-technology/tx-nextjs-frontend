import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const path = qs ? `${endpoints.business.team}?${qs}` : endpoints.business.team;
  return proxyToB2B(path);
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyToB2B(endpoints.business.team, { method: "POST", body });
}
