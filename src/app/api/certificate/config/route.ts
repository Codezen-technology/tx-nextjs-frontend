import { proxyToWP } from "@/lib/api/bff";

/**
 * Certificate pricing schema (products/choices/prices/quantities/shipping).
 *
 * Proxied rather than fetched browser-direct: the WP host answers cross-origin
 * XHR from browsers with a SiteGround anti-bot captcha page (HTTP 202, HTML, no
 * `Access-Control-Allow-Origin`), which the browser surfaces as a CORS error.
 * Going through the BFF makes it a same-origin request from Vercel.
 */
export async function GET() {
  return proxyToWP("/certificate/config", { requiresAuth: false });
}
