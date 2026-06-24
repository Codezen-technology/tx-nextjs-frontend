import { proxyToB2B } from "@/lib/api/bff";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyToB2B(`/team/${encodeURIComponent(id)}/convert-role`, {
    method: "POST",
    body,
  });
}
