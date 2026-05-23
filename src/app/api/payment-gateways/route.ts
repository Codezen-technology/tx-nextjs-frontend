import { NextResponse } from "next/server";
import { proxyToWCRest } from "@/lib/api/bff";

export async function GET() {
  const res = await proxyToWCRest("/payment_gateways");
  if (!res.ok) return res;

  const gateways = (await res.json()) as Array<Record<string, unknown>>;

  // Strip sensitive gateway settings before sending to browser.
  const safe = gateways
    .filter((g) => g.enabled === true)
    .map(({ id, title, description, enabled, method_title, supports, features }) => ({
      id,
      title,
      description,
      enabled,
      method_title,
      supports,
      features,
    }));

  return NextResponse.json(safe);
}
