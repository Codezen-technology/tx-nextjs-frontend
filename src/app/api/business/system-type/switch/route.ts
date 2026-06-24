import { proxyToB2B } from "@/lib/api/bff";

export async function POST(req: Request) {
  const body = await req.json();
  return proxyToB2B("/business/switch-system", { method: "POST", body });
}
