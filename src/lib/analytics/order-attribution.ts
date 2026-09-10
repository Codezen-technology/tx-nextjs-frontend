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
 * The 16 values both write shapes carry, keyed by WooCommerce's own field
 * names. The two builders differ in how they *shape* these, not in what they
 * hold, so the extraction lives here once.
 *
 * `session_count` is the one field taken from first-touch rather than the
 * session: it counts the visitor's lifetime sessions, not this one.
 */
function attributionValues(
  state: AttributionState,
  userAgent: string,
): Record<string, string | number> | null {
  const session = state.session;
  if (!session) return null;

  return {
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
  const values = attributionValues(state, userAgent);
  if (!values) return [];

  const fields: Record<string, string | number> = {
    ...values,
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
  const values = attributionValues(state, userAgent);
  if (!values) return null;

  const out: Record<string, string> = {};
  for (const field of STORE_API_FIELDS) {
    const value = values[field];
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
 * Set the WooCommerce attribution extension on a Store API request body from
 * the visitor's cookies, leaving any *other* extension the caller set in place.
 *
 * The attribution namespace itself is always stripped from the incoming body
 * first, including when there are no cookies to replace it with. Attribution is
 * never accepted from a request body: without that strip, a cookieless caller
 * could hand WooCommerce whatever campaign it liked and poison the reports.
 */
export function withStoreApiAttribution(
  body: Record<string, unknown>,
  req: Request,
): Record<string, unknown> {
  const attribution = storeApiAttributionFromRequest(req);
  const incoming = body.extensions as Record<string, unknown> | undefined;
  const bodySuppliedAttribution = incoming !== undefined && WC_ATTRIBUTION_EXTENSION in incoming;

  if (!attribution && !bodySuppliedAttribution) return body;

  const extensions = { ...incoming };
  delete extensions[WC_ATTRIBUTION_EXTENSION];
  if (attribution) {
    extensions[WC_ATTRIBUTION_EXTENSION] = attribution;
  }

  return { ...body, extensions };
}
