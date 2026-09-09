import { deviceType } from "./attribution";
import { readAttributionState, type AttributionState } from "./attribution-cookies";

/**
 * WooCommerce's own Order Attribution namespace. Writing these keys means the
 * order list column and the Analytics reports light up with no PHP at all —
 * only the browser-side capture was ever missing in a headless setup.
 *
 * Key names verified against WooCommerce trunk,
 * src/Internal/Traits/OrderAttributionMeta.php, and against a real order on the
 * store. See docs/research/2026-09-09-woocommerce-order-attribution.md.
 */
export const WC_ATTRIBUTION_PREFIX = "_wc_order_attribution_";

/**
 * Store API extension namespace WooCommerce registers for exactly this data,
 * in src/Internal/Orders/OrderAttributionBlocksController.php. Declared on the
 * `checkout` schema and inherited by `checkout-order`, so both Store API order
 * paths accept it.
 */
export const WC_ATTRIBUTION_EXTENSION = "woocommerce/order-attribution";

export interface OrderMetaEntry {
  key: string;
  value: string;
}

/**
 * The WC REST v3 shape: 17 prefixed keys, empty values dropped.
 *
 * `device_type` is written explicitly here because nothing on the REST v3 path
 * derives it. The Store API builder below deliberately omits it, since
 * WooCommerce derives it there from `user_agent`.
 */
export function buildOrderAttributionMeta(
  state: AttributionState,
  userAgent: string,
): OrderMetaEntry[] {
  const session = state.session;
  if (!session) return [];

  const fields: Record<string, string | number> = {
    source_type: session.source_type,
    referrer: session.referrer,
    utm_source: session.utm_source,
    utm_medium: session.utm_medium,
    utm_campaign: session.utm_campaign,
    utm_content: session.utm_content,
    utm_term: session.utm_term,
    utm_id: session.utm_id,
    utm_source_platform: session.utm_source_platform,
    utm_creative_format: session.utm_creative_format,
    utm_marketing_tactic: session.utm_marketing_tactic,
    session_entry: session.session_entry,
    session_start_time: session.session_start_time,
    session_pages: session.session_pages,
    session_count: state.first?.session_count ?? 1,
    user_agent: userAgent,
    device_type: deviceType(userAgent),
  };

  return Object.entries(fields)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .map(([name, value]) => ({ key: `${WC_ATTRIBUTION_PREFIX}${name}`, value: String(value) }));
}

/** Convenience for BFF route handlers, which hold a plain `Request`. */
export function orderAttributionMetaFromRequest(req: Request): OrderMetaEntry[] {
  return buildOrderAttributionMeta(
    readAttributionState(req.headers.get("cookie")),
    req.headers.get("user-agent") ?? "",
  );
}

/**
 * The sixteen field names WooCommerce declares on the Store API extension —
 * `array_keys( $default_fields )` in the OrderAttributionMeta trait.
 */
const STORE_API_FIELDS = [
  "source_type",
  "referrer",
  "utm_campaign",
  "utm_source",
  "utm_medium",
  "utm_content",
  "utm_id",
  "utm_term",
  "utm_source_platform",
  "utm_creative_format",
  "utm_marketing_tactic",
  "session_entry",
  "session_start_time",
  "session_pages",
  "session_count",
  "user_agent",
] as const;

/**
 * Build the `extensions["woocommerce/order-attribution"]` payload.
 *
 * Every field must be present and must be a string. WooCommerce indexes the
 * array with no null-coalesce, so an omitted key raises a PHP undefined-key
 * warning; `"(none)"` is the sentinel its own reader explicitly skips.
 */
export function buildStoreApiAttributionExtension(
  state: AttributionState,
  userAgent: string,
): Record<string, string> | null {
  const session = state.session;
  if (!session) return null;

  const source: Record<string, string | number> = {
    source_type: session.source_type,
    referrer: session.referrer,
    utm_campaign: session.utm_campaign,
    utm_source: session.utm_source,
    utm_medium: session.utm_medium,
    utm_content: session.utm_content,
    utm_id: session.utm_id,
    utm_term: session.utm_term,
    utm_source_platform: session.utm_source_platform,
    utm_creative_format: session.utm_creative_format,
    utm_marketing_tactic: session.utm_marketing_tactic,
    session_entry: session.session_entry,
    session_start_time: session.session_start_time,
    session_pages: session.session_pages,
    session_count: state.first?.session_count ?? 1,
    user_agent: userAgent,
  };

  const out: Record<string, string> = {};
  for (const field of STORE_API_FIELDS) {
    const value = source[field];
    out[field] = value === "" || value === undefined || value === null ? "(none)" : String(value);
  }
  return out;
}

export function storeApiAttributionFromRequest(req: Request): Record<string, string> | null {
  return buildStoreApiAttributionExtension(
    readAttributionState(req.headers.get("cookie")),
    req.headers.get("user-agent") ?? "",
  );
}

/**
 * Merge the WooCommerce attribution extension into a Store API request body,
 * leaving any extension the caller already set in place. Returns the body
 * unchanged when the visitor carries no attribution cookies.
 */
export function withStoreApiAttribution(
  body: Record<string, unknown>,
  req: Request,
): Record<string, unknown> {
  const attribution = storeApiAttributionFromRequest(req);
  if (!attribution) return body;

  const existing = (body.extensions ?? {}) as Record<string, unknown>;
  return {
    ...body,
    extensions: { ...existing, [WC_ATTRIBUTION_EXTENSION]: attribution },
  };
}
