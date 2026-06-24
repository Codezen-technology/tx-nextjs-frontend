import { proxyToB2B } from "@/lib/api/bff";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const path = qs ? `/courses/assignments?${qs}` : "/courses/assignments";
  return proxyToB2B(path);
}
