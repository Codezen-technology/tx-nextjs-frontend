import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";
import { courseSubpath } from "@/lib/api/endpoints";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Server-to-server read of `GET /courses/{id}/curriculum`.
 *
 * The browser cannot call WordPress directly here: the CMS lives on another
 * origin and answers without CORS headers. Proxying keeps the request
 * same-origin and lets `proxyToWP` attach the httpOnly access token, so
 * enrolled users get their per-unit completion state.
 *
 * `requiresAuth: false` — API_REFERENCE.md documents the endpoint as public, so
 * signed-out visitors must still get a curriculum. A signed-in user's token is
 * forwarded when present, and `proxyToWP` refreshes it (or falls back to the
 * anonymous response) if WordPress rejects it as expired.
 *
 * `courseSubpath` keeps the numeric-id vs slug branch that `endpoints.ts` owns.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing course id" }, { status: 400 });
  }
  return proxyToWP(courseSubpath(id, "curriculum"), { requiresAuth: false });
}
