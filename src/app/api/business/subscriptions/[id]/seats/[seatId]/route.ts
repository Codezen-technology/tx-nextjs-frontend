import { proxyToB2B } from "@/lib/api/bff";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; seatId: string }> },
) {
  const { id, seatId } = await params;
  return proxyToB2B(
    `/businesses/subscriptions/${encodeURIComponent(id)}/seats/${encodeURIComponent(seatId)}`,
    { method: "DELETE" },
  );
}
