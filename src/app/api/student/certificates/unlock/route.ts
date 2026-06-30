import { proxyToWP } from "@/lib/api/bff";

export async function POST(req: Request) {
  const body = await req.json();
  return proxyToWP("/student/certificates/unlock", { method: "POST", body, request: req });
}
