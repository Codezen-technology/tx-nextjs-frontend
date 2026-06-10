import { proxyToWP } from "@/lib/api/bff";

export async function GET() {
  return proxyToWP("/admin/subscription-promo-settings", { requiresAuth: false });
}
