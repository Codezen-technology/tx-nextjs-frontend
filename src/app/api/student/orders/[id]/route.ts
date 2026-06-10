import { proxyToWP } from "@/lib/api/bff";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return proxyToWP(`/orders/${params.id}`);
}
