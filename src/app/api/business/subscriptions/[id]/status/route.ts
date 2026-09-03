import { proxyToB2B } from "@/lib/api/bff";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyToB2B(`/businesses/subscriptions/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body,
  });
}
