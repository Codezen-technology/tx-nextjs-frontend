import { proxyToWP } from "@/lib/api/bff";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyToWP("/orders", { method: "POST", body, requiresAuth: false });
}

export async function GET() {
  return proxyToWP("/orders", { requiresAuth: true });
}
