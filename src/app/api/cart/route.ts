import { proxyToWCStore } from "@/lib/api/bff";

export async function GET(req: Request) {
  return proxyToWCStore("/cart", { request: req });
}

export async function DELETE(req: Request) {
  // DELETE /wc/store/v1/cart/items clears all items from the cart.
  return proxyToWCStore("/cart/items", { method: "DELETE", request: req });
}
