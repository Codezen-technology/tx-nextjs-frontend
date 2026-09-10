import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { proxyToWP } from "@/lib/api/bff";
import { REST_NAMESPACES } from "@/lib/api/endpoints";

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
 * Namespaces the browser may read through this route.
 *
 * Built from `REST_NAMESPACES` rather than written out, so adding a namespace
 * to `endpoints.ts` cannot silently leave this list behind. The WooCommerce
 * entries are omitted on purpose: routing them here would strip the Cart-Token
 * and Basic auth their own routes attach.
 */
export const READ_NAMESPACES: ReadonlySet<string> = new Set([
  REST_NAMESPACES.lms,
  REST_NAMESPACES.wp,
  REST_NAMESPACES.swca,
]);

/**
 * A segment that could change which namespace the URL ends up addressing.
 *
 * `encodeURIComponent` leaves `.` and `..` untouched, and the upstream URL is
 * built by string concatenation before `fetch` parses it — and URL parsing
 * resolves dot segments. So `…/lms-backend/v1/../../wc/v3/orders` reaches the
 * WooCommerce namespace with an allowlisted prefix. Next currently strips dot
 * segments during routing, but the allowlist is a security boundary and must
 * not depend on that: it is checked here, where the decision is made.
 */
function isTraversalSegment(segment: string): boolean {
  return segment === "" || segment === "." || segment === "..";
}

interface RouteContext {
  params: Promise<{ path?: string[] }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { path } = await params;
  const segments = path ?? [];

  const namespace = segments.slice(0, NAMESPACE_SEGMENTS).join("/");
  if (!READ_NAMESPACES.has(namespace)) {
    return NextResponse.json(
      { error: "Unsupported API namespace", code: "unsupported_namespace" },
      { status: 400 },
    );
  }

  const resourceSegments = segments.slice(NAMESPACE_SEGMENTS);

  if (resourceSegments.some(isTraversalSegment)) {
    return NextResponse.json(
      { error: "Invalid resource path", code: "invalid_path" },
      { status: 400 },
    );
  }

  // Next hands these back percent-decoded; re-encode so a slug containing
  // reserved characters rebuilds into the same path WordPress was asked for.
  const wpPath = resourceSegments.map((segment) => encodeURIComponent(segment)).join("/");

  if (!wpPath) {
    return NextResponse.json(
      { error: "Missing resource path", code: "missing_path" },
      { status: 400 },
    );
  }

  const { search } = new URL(request.url);
  const res = await proxyToWP(`/${wpPath}${search}`, { namespace, requiresAuth: false });

  // Only a successful, credential-free read may be shared.
  //
  // Status matters as much as the cookie: a challenge page surfaces here as a
  // 502 and an upstream outage as a 5xx, and caching either publicly would
  // serve one bad minute at the CMS to every visitor for the next five.
  //
  // `Vary: Cookie` is what keeps credentialed reads out of the shared entry,
  // and it is also what caps the hit rate: any per-visitor cookie splits the
  // entry. Getting real reuse means keeping session cookies off the read path,
  // not widening this rule.
  const hasCredential = Boolean((await cookies()).get("access_token")?.value);
  const shareable = res.ok && !hasCredential;
  res.headers.set(
    "Cache-Control",
    shareable ? "public, s-maxage=300, stale-while-revalidate=600" : "private, no-store",
  );
  res.headers.set("Vary", "Cookie");

  return res;
}
