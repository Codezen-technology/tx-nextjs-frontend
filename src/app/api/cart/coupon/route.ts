import { proxyToWP } from "@/lib/api/bff";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyToWP("/cart/coupon", { method: "POST", body, requiresAuth: false, wcSession: true, request: req });
}
