import { NextResponse, type NextRequest } from "next/server";
import { proxyToWP } from "@/lib/api/bff";
import { DEFAULT_CERT_PRODUCT, isCertProductSlug } from "@/types/certificate";

/**
 * Server-authoritative quote for a certificate selection.
 *
 * Same reason as `/api/certificate/config` — the browser cannot reach the WP
 * REST API cross-origin (SiteGround captcha, no CORS headers).
 *
 * The product slug is taken from the request body and put in the upstream *path*,
 * which is how the plugin scopes pricing. An unknown slug is rejected rather than
 * defaulted: the two forms reuse the same field ids for different products, so a
 * silent fallback would price the wrong offer.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const requested = body.product;

  if (requested !== undefined && requested !== null && !isCertProductSlug(requested)) {
    return NextResponse.json({ error: "Unknown certificate product" }, { status: 400 });
  }

  const product = isCertProductSlug(requested) ? requested : DEFAULT_CERT_PRODUCT;
  const path =
    product === DEFAULT_CERT_PRODUCT
      ? "/certificate/quote"
      : `/certificate/${encodeURIComponent(product)}/quote`;

  // The slug is a path segment upstream; drop it from the body so the plugin sees
  // exactly the selection shape it documents.
  const { product: _slug, ...selection } = body;

  return proxyToWP(path, { method: "POST", body: selection, requiresAuth: false });
}
