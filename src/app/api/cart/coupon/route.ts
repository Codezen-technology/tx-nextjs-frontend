import { proxyToWCStore } from "@/lib/api/bff";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyToWCStore("/cart/apply-coupon", { method: "POST", body, request: req });
}
