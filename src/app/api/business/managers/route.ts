import { proxyToB2B } from "@/lib/api/bff";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("business_id");
  const path = businessId ? `/managers/business/${encodeURIComponent(businessId)}` : "/managers";
  return proxyToB2B(path);
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyToB2B("/managers", { method: "POST", body });
}
