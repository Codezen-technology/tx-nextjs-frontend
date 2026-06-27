import { proxyToB2B } from "@/lib/api/bff";

/** Public B2B plugin activation probe — no auth required. */
export async function GET() {
  return proxyToB2B("/status", { requiresAuth: false });
}
