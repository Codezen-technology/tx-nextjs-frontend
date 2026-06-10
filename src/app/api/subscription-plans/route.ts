import { proxyToWP } from "@/lib/api/bff";

export async function GET() {
  return proxyToWP("/subscription-plans", { requiresAuth: false });
}
