import { proxyToWCStore } from "@/lib/api/bff";
import { withStoreApiAttribution } from "@/lib/analytics/order-attribution";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return proxyToWCStore("/checkout", {
    method: "POST",
    body: withStoreApiAttribution(body, req),
    request: req,
  });
}
