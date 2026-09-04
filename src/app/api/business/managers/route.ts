import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("business_id");
  const path = businessId
    ? endpoints.business.managersForBusiness(businessId)
    : endpoints.business.managers;
  return proxyToB2B(path);
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyToB2B(endpoints.business.managers, { method: "POST", body });
}
