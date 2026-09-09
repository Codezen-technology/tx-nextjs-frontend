import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { endpoints } from "@/lib/api/endpoints";
import { getServerWpJsonBase } from "@/lib/env";

/**
 * Gravity Forms validate and submit, proxied same-origin.
 *
 * These are the only browser-initiated writes that used to go straight to the
 * CMS. They cannot any more: the CMS answers unrecognised callers with a
 * bot-protection challenge that carries no CORS headers, so the request never
 * completes from the browser. `src/app/api/wp/[...path]/route.ts` covers reads
 * and is deliberately `GET`-only, hence this separate write route.
 *
 * Public by design — a contact or cancellation form must work signed-out. A
 * signed-in user's token is forwarded when present so Gravity Forms can map the
 * entry to them, but its absence is never an error.
 *
 * The upstream body is relayed **verbatim**, status and all. That is the point:
 * a 422 carries per-field messages under `data.validation_messages`, and
 * `formsService` reads them off the raw body to build `FormValidationError`.
 * Reshaping the response — as the enveloping proxies do — would drop the field
 * errors and turn "fix these three fields" into a generic failure.
 */

export const runtime = "nodejs";

/**
 * Only the two Gravity Forms write actions; not a general form-namespace proxy.
 * The upstream paths come from `endpoints.ts`, which owns every URL string.
 */
const ACTIONS: Record<string, (id: string) => string> = {
  validate: (id) => endpoints.forms.validate(id),
  submissions: (id) => endpoints.forms.submit(id),
};

interface RouteContext {
  params: Promise<{ id: string; action: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id, action } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: "Invalid form id", code: "invalid_form_id" },
      { status: 400 },
    );
  }
  const upstreamPath = ACTIONS[action];
  if (!upstreamPath) {
    return NextResponse.json(
      { error: "Unsupported form action", code: "unsupported_action" },
      { status: 400 },
    );
  }

  const base = getServerWpJsonBase();
  if (!base) {
    return NextResponse.json(
      { error: "WordPress API is not configured", code: "wp_not_configured" },
      { status: 500 },
    );
  }
  const url = `${base}${upstreamPath(id)}`;

  const headers: Record<string, string> = {};
  const accessToken = (await cookies()).get("access_token")?.value;
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  // Relay the body as sent. Multipart carries file uploads and its own boundary
  // in the Content-Type, so that header is copied rather than reconstructed —
  // rebuilding it would invalidate the boundary and lose every attachment.
  const contentType = request.headers.get("content-type") ?? "";
  const isMultipart = contentType.startsWith("multipart/form-data");
  let body: BodyInit;
  if (isMultipart) {
    body = await request.formData();
  } else {
    body = await request.text();
    headers["Content-Type"] = contentType || "application/json";
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, { method: "POST", headers, body });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the form service", code: "upstream_unreachable" },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  const res = new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      // A submission is never cacheable, and must never be shared.
      "Cache-Control": "private, no-store",
    },
  });
  return res;
}
