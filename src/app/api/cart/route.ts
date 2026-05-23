import { proxyToWP } from "@/lib/api/bff";

export async function GET(req: Request) {
  return proxyToWP("/cart", { requiresAuth: false, wcSession: true, request: req });
}

export async function DELETE(req: Request) {
  return proxyToWP("/cart", { method: "DELETE", requiresAuth: false, wcSession: true, request: req });
}
