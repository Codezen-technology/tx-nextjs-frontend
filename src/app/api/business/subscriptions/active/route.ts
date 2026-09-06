import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function GET() {
  return proxyToB2B(endpoints.business.subscriptionActive);
}
