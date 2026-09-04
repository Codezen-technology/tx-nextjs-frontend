import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function PUT(req: Request, { params }: { params: Promise<{ managerId: string }> }) {
  const { managerId } = await params;
  const body = await req.json();
  return proxyToB2B(endpoints.business.managerPermissions(managerId), {
    method: "PUT",
    body,
  });
}
