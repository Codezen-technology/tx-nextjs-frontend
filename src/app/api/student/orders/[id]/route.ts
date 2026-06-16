import { proxyToWP } from "@/lib/api/bff";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToWP(`/orders/${id}`);
}
