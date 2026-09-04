import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

/** Public B2B plugin activation probe — no auth required. */
export async function GET() {
  return proxyToB2B(endpoints.business.status, { requiresAuth: false });
}
