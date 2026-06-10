import { proxyToWP } from "@/lib/api/bff";

export async function GET() {
  return proxyToWP("/admin/subscription-plan-settings");
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyToWP("/admin/subscription-plan-settings", { method: "POST", body });
}
