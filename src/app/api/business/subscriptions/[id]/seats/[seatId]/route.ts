import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; seatId: string }> },
) {
  const { id, seatId } = await params;
  return proxyToB2B(endpoints.business.subscriptionSeat(id, seatId), { method: "DELETE" });
}
