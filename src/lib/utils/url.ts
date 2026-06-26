import { env } from "@/lib/env";

/**
 * WP → frontend URL rewriting.
 *
 * The WP REST API returns absolute URLs built on the WordPress backend origin
 * (e.g. `https://tx-local-site.test/product/x/`). The headless frontend runs on
 * a different origin, so any backend-origin URL rendered raw sends the user back
 * to the old WP site. These helpers swap the backend origin for the frontend
 * origin while leaving relative URLs and genuinely third-party URLs untouched.
 *
 * Apply at the SERVICE layer (services normalise WP-shaped data) — never inline
 * in components. Components only decide `<Link>` vs `<a target="_blank">` via
 * {@link isExternalUrl}.
 *
 * Only content / navigation permalinks should be rewritten. Functional backend
 * endpoints (WooCommerce checkout / pay / add-to-cart, certificate PDF download)
 * must keep hitting the backend and must NOT be passed through these helpers.
 */

function safeOrigin(base: string): string {
  if (!base) return "";
  try {
    return new URL(base.replace(/\/$/, "")).origin;
  } catch {
    return "";
  }
}

/** WordPress backend origin, e.g. `https://tx-local-site.test`. Empty if unset/invalid. */
export const WP_ORIGIN = safeOrigin(env.WP_API_URL);

/** Headless frontend origin, e.g. `http://localhost:3000`. */
export const SITE_ORIGIN = safeOrigin(env.SITE_URL);

/** Parse an absolute URL, or null when `url` is relative / invalid. */
function parseAbsolute(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/** True if `url` is an absolute URL on the WP backend origin. */
export function isWpBackendUrl(url: string | null | undefined): boolean {
  if (!url || !WP_ORIGIN) return false;
  return parseAbsolute(url)?.origin === WP_ORIGIN;
}

/**
 * True if `url` is absolute AND points neither at the WP backend nor at our own
 * site — i.e. a genuinely third-party link that should open in a new tab.
 * Relative URLs are treated as internal (false).
 */
export function isExternalUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const parsed = parseAbsolute(url);
  if (!parsed) return false;
  return parsed.origin !== WP_ORIGIN && parsed.origin !== SITE_ORIGIN;
}

/**
 * Rewrite a WP-backend absolute URL to the frontend origin, preserving
 * pathname + search + hash. Relative / same-site / external / empty values pass
 * through unchanged. Returns an ABSOLUTE frontend URL — use for share links, OG
 * tags, anything needing a full URL.
 */
export function toFrontendUrl(url: string | null | undefined): string {
  if (!url) return "";
  const parsed = parseAbsolute(url);
  if (!parsed) return url;
  if (parsed.origin === WP_ORIGIN && SITE_ORIGIN) {
    return `${SITE_ORIGIN}${parsed.pathname}${parsed.search}${parsed.hash}`;
  }
  return url;
}

/**
 * Like {@link toFrontendUrl} but returns a ROOT-RELATIVE path (`/product/...`)
 * for backend / same-site URLs so it can feed `<Link href>` or a relative `<a>`.
 * Genuinely external URLs are returned unchanged (caller renders a new-tab link).
 */
export function toFrontendPath(url: string | null | undefined): string {
  if (!url) return "";
  const parsed = parseAbsolute(url);
  if (!parsed) return url;
  if (parsed.origin === WP_ORIGIN || parsed.origin === SITE_ORIGIN) {
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }
  return url;
}

/**
 * Bulk-swap every backend-origin occurrence with the frontend origin inside an
 * arbitrary string — used for JSON-LD blobs where URLs are embedded as values.
 */
export function replaceWpOrigin(s: string): string {
  if (!s || !WP_ORIGIN || !SITE_ORIGIN) return s;
  return s.split(WP_ORIGIN).join(SITE_ORIGIN);
}
