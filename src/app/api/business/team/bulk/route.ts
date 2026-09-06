import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function POST(req: Request) {
  const body = await req.json();
  return proxyToB2B(endpoints.business.teamBulk, { method: "POST", body });
}
