import { proxyToWCStore } from "@/lib/api/bff";

export async function POST(req: Request) {
  const raw = await req.json().catch(() => ({})) as { product_id?: number; id?: number; quantity?: number };
  // WC Store API uses 'id'; service layer sends 'product_id'.
  const body = { id: raw.id ?? raw.product_id, quantity: raw.quantity ?? 1 };
  return proxyToWCStore("/cart/add-item", { method: "POST", body, request: req });
}
