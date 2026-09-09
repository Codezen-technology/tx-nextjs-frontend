import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";
import { env } from "@/lib/env";

/**
 * Same-origin read proxy for every WordPress REST read the browser makes.
 *
 * The CMS is on another origin and sits behind bot protection that answers an
 * unrecognised caller with a challenge interstitial — HTTP 202, `text/html`,
 * and no `Access-Control-Allow-Origin`. That kills any browser XHR to the CMS
 * as a CORS error regardless of what the endpoint itself would have returned,
 * and it can happen to *any* path at any time. So the browser stops talking to
 * the CMS entirely: `src/lib/api/client.ts` points its Axios base URL here, and
 * this route makes the call server-side where CORS does not apply.
 *
 * Deliberately narrow. `GET` only, no request body forwarded, and only the REST
 * namespaces the browser client actually reads. It is a read proxy for content,
 * not a general-purpose forwarder — the destination origin comes from server
 * config and is never taken from the request. Authenticated mutations, cart
 * traffic and the WooCommerce namespaces keep their own BFF routes, which carry
 * Cart-Token and Basic-auth handling this route does not implement.
 *
 * `requiresAuth: false` — these are public reads, so a signed-out visitor must
 * get content. A signed-in user's httpOnly token is still forwarded when
 * present, and `proxyToWP` refreshes it (or drops it and serves the anonymous
 * response) if WordPress rejects it as expired.
 */

export const runtime = "nodejs";

/** Every WordPress REST namespace is `vendor/version`, hence the two-segment split. */
const NAMESPACE_SEGMENTS = 2;

/**
 * Namespaces `endpoints.ts` emits for the Axios client, and nothing else.
 *
 * Read from `env` rather than hardcoded so a `NEXT_PUBLIC_LMS_NAMESPACE`
 * override cannot desync this list from the endpoints it is meant to mirror.
 * `wc/store/v1` and `wc/v3` are excluded on purpose: routing them here would
 * silently strip the auth they require.
 */
function allowedNamespaces(): Set<string> {
  return new Set([env.LMS_NAMESPACE, "wp/v2", "swca/v1"]);
}

interface RouteContext {
  params: Promise<{ path?: string[] }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { path } = await params;
  const segments = path ?? [];

  const namespace = segments.slice(0, NAMESPACE_SEGMENTS).join("/");
  if (!allowedNamespaces().has(namespace)) {
    return NextResponse.json(
      { error: "Unsupported API namespace", code: "unsupported_namespace" },
      { status: 400 },
    );
  }

  // Next hands these back percent-decoded; re-encode so a slug containing
  // reserved characters rebuilds into the same path WordPress was asked for.
  const wpPath = segments
    .slice(NAMESPACE_SEGMENTS)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  if (!wpPath) {
    return NextResponse.json(
      { error: "Missing resource path", code: "missing_path" },
      { status: 400 },
    );
  }

  const { search } = new URL(request.url);
  const res = await proxyToWP(`/${wpPath}${search}`, { namespace, requiresAuth: false });

  // A read carrying no credential is identical for everyone, so the CDN may
  // hold it. A read carrying one is personalised and must not be stored at all.
  //
  // `Vary: Cookie` is what keeps the two apart, and it is also what caps the hit
  // rate: any per-visitor cookie on the request splits the cache entry. Getting
  // real reuse out of this means keeping session cookies off the read path, not
  // widening the caching rule.
  const hasCredential = Boolean((await cookies()).get("access_token")?.value);
  res.headers.set(
    "Cache-Control",
    hasCredential ? "private, no-store" : "public, s-maxage=300, stale-while-revalidate=600",
  );
  res.headers.set("Vary", "Cookie");

  return res;
}
