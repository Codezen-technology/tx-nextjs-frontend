import { proxyToB2B } from "@/lib/api/bff";

export async function GET(req: Request) {
  const qs = new URL(req.url).searchParams.toString();
  const path = qs ? `/managers/check-email?${qs}` : "/managers/check-email";
  return proxyToB2B(path);
}
