import { proxyToB2B } from "@/lib/api/bff";

export async function GET() {
  return proxyToB2B("/business/system-type");
}
