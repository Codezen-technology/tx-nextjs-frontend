import { proxyToWP } from "@/lib/api/bff";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const path = qs ? `/orders?${qs}` : "/orders";
  return proxyToWP(path);
}
