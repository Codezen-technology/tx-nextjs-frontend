import { proxyToWP } from "@/lib/api/bff";

export async function GET(req: Request) {
  return proxyToWP("/student/certificate-orders/config", { request: req });
}
