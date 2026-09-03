import { proxyToB2B } from "@/lib/api/bff";

export async function PUT(req: Request, { params }: { params: Promise<{ managerId: string }> }) {
  const { managerId } = await params;
  const body = await req.json();
  return proxyToB2B(`/permissions/business/managers/${encodeURIComponent(managerId)}/permissions`, {
    method: "PUT",
    body,
  });
}
