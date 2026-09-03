import { proxyToB2B } from "@/lib/api/bff";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToB2B(`/managers/${encodeURIComponent(id)}`);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyToB2B(`/managers/${encodeURIComponent(id)}`, { method: "PUT", body });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToB2B(`/managers/${encodeURIComponent(id)}`, { method: "DELETE" });
}
