import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const base = endpoints.business.savedReports;
  return proxyToB2B(qs ? `${base}?${qs}` : base);
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyToB2B(endpoints.business.savedReports, { method: "POST", body });
}
