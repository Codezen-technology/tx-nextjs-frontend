import { proxyFormDataToWP, proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";
import { env } from "@/lib/env";

/**
 * `{id}` here is the **b2b_businesses row id**, unlike the sibling profile route
 * whose segment is the owner's user id. The backend names both explicitly.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await req.formData();
  return proxyFormDataToWP(endpoints.business.businessLogo(id), formData, {
    namespace: env.B2B_NAMESPACE,
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToB2B(endpoints.business.businessLogo(id), { method: "DELETE" });
}
