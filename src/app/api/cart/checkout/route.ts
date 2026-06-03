import { proxyToWCStore } from "@/lib/api/bff";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyToWCStore("/checkout", { method: "POST", body, request: req });
}
