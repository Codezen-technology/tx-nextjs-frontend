import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function GET(req: Request) {
  const qs = new URL(req.url).searchParams.toString();
  const path = qs
    ? `${endpoints.business.managerCheckEmail}?${qs}`
    : endpoints.business.managerCheckEmail;
  return proxyToB2B(path);
}
