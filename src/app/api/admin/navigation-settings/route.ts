import { proxyToWP } from "@/lib/api/bff";

export async function GET() {
  return proxyToWP("/admin/navigation-settings", { requiresAuth: false });
}
