import { proxyToB2B } from "@/lib/api/bff";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const path = qs ? `/reports/certificates?${qs}` : "/reports/certificates";
  return proxyToB2B(path);
}
