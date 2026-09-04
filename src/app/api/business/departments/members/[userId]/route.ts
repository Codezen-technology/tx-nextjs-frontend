import { proxyToB2B } from "@/lib/api/bff";
import { endpoints } from "@/lib/api/endpoints";

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return proxyToB2B(endpoints.business.departmentMembers(userId));
}

/** PUT, not PATCH — this replaces the whole membership set. */
export async function PUT(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const body = await req.json();
  return proxyToB2B(endpoints.business.departmentMembers(userId), { method: "PUT", body });
}
