import { NextResponse, type NextRequest } from "next/server";
import { proxyToWP } from "@/lib/api/bff";
import { DEFAULT_CERT_PRODUCT, isCertProductSlug } from "@/types/certificate";

/**
 * Certificate pricing schema (products/choices/prices/quantities/shipping).
 *
 * Proxied rather than fetched browser-direct: the WP host answers cross-origin
 * XHR from browsers with a SiteGround anti-bot captcha page (HTTP 202, HTML, no
 * `Access-Control-Allow-Origin`), which the browser surfaces as a CORS error.
 * Going through the BFF makes it a same-origin request from Vercel.
 *
 * `product` selects which offer (and therefore which Gravity Form) to price
 * against. It is re-validated here rather than trusted from the page, because the
 * browser can call this route directly. An unknown slug is rejected instead of
 * defaulting, so a typo can never quietly return another offer's prices.
 */
export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("product");

  if (requested !== null && !isCertProductSlug(requested)) {
    return NextResponse.json({ error: "Unknown certificate product" }, { status: 400 });
  }

  const product = requested ?? DEFAULT_CERT_PRODUCT;
  // proxyToWP paths are namespace-relative. The unscoped path is the plugin's own
  // alias for `default`, so this stays byte-identical for `/certificate` and keeps
  // working against plugin builds that predate the product-scoped routes.
  const path =
    product === DEFAULT_CERT_PRODUCT
      ? "/certificate/config"
      : `/certificate/${encodeURIComponent(product)}/config`;

  return proxyToWP(path, { requiresAuth: false });
}
