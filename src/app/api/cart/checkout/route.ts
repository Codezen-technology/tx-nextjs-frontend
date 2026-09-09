import { proxyToWCStore } from "@/lib/api/bff";
import { withStoreApiAttribution } from "@/lib/analytics/order-attribution";
import { pixelYourSiteQueryFromRequest } from "@/lib/analytics/pixelyoursite";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // PixelYourSite reads its fields from `$_REQUEST`, which a JSON body never
  // reaches, so its parameters ride on the query string instead.
  return proxyToWCStore(`/checkout${pixelYourSiteQueryFromRequest(req)}`, {
    method: "POST",
    body: withStoreApiAttribution(body, req),
    request: req,
  });
}
