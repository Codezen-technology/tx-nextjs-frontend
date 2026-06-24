import { proxyToB2B } from "@/lib/api/bff";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const path = qs ? `/team?${qs}` : "/team";
  return proxyToB2B(path);
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyToB2B("/team", { method: "POST", body });
}
