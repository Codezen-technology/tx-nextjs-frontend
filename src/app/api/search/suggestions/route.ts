import { type NextRequest, NextResponse } from "next/server";
import { getServerWpJsonBase } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const base = getServerWpJsonBase();
  if (!base) return NextResponse.json({ results: [] });

  try {
    const url = `${base}/lms-backend/v1/courses?search=${encodeURIComponent(q)}&per_page=8&fields=id,title,slug,image_url,price`;
    const res = await fetch(url, { next: { revalidate: 0 } });

    if (!res.ok) return NextResponse.json({ results: [] });

    const data = (await res.json()) as {
      success?: boolean;
      data?: { items?: unknown[]; [k: string]: unknown } | unknown[];
    };

    let items: Array<{
      id?: number;
      title?: string;
      slug?: string;
      image_url?: string;
      price?: string;
    }> = [];

    if (data?.success && Array.isArray((data.data as { items?: unknown[] })?.items)) {
      items = (data.data as { items: typeof items }).items;
    } else if (Array.isArray(data)) {
      items = data as typeof items;
    } else if (Array.isArray(data?.data)) {
      items = data.data as typeof items;
    }

    const results = items.slice(0, 8).map((c) => ({
      id: c.id,
      title:
        typeof c.title === "string"
          ? c.title
          : ((c.title as unknown as { rendered?: string })?.rendered ?? ""),
      slug: c.slug ?? "",
      image_url: c.image_url ?? null,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
