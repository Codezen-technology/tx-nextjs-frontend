import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function POST() {
  return proxyToB2B(endpoints.business.settingsReset, { method: "POST", body: {} });
}
