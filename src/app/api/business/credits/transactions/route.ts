import { proxyToB2B } from "@/lib/api/bff";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const path = qs ? `/credits/transactions?${qs}` : "/credits/transactions";
  return proxyToB2B(path);
}
