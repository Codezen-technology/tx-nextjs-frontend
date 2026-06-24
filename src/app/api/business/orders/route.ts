import { proxyToB2B } from "@/lib/api/bff";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const path = qs ? `/businesses/orders?${qs}` : "/businesses/orders";
  return proxyToB2B(path);
}
