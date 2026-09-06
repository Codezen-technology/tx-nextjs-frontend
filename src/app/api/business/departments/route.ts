import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function GET() {
  return proxyToB2B(endpoints.business.departments);
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyToB2B(endpoints.business.departments, { method: "POST", body });
}
