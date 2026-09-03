import { proxyToB2B } from "@/lib/api/bff";

export async function GET(req: Request) {
  const qs = new URL(req.url).searchParams.toString();
  const path = qs ? `/permissions/manager/capabilities?${qs}` : "/permissions/manager/capabilities";
  return proxyToB2B(path);
}
