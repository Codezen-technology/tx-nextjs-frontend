import { proxyToWCStore } from "@/lib/api/bff";
import { readAttributionState } from "@/lib/analytics/attribution-cookies";
import { withStoreApiAttribution } from "@/lib/analytics/order-attribution";
import { pixelYourSiteQuery } from "@/lib/analytics/pixelyoursite";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // PixelYourSite reads its fields from `$_REQUEST`, which a JSON body never
  // reaches, so its parameters ride on the query string instead.
  const pys = pixelYourSiteQuery(readAttributionState(req.headers.get("cookie")));

  return proxyToWCStore(`/checkout${pys}`, {
    method: "POST",
    body: withStoreApiAttribution(body, req),
    request: req,
  });
}
