import type { Attribution } from "./attribution";
import type { AttributionState } from "./attribution-cookies";

/**
 * PixelYourSite reads every attribution field from `$_REQUEST` before falling
 * back to its own cookie and session, so query-string parameters on the
 * order-creating call populate its order metabox with no PHP.
 *
 * The literal "REST API" it shows otherwise is a sentinel it substitutes when
 * the cookie and session are empty and `REST_REQUEST` is defined — exactly the
 * server-to-server case. Verified end to end against the store: an order
 * created with these parameters stores a fully populated `pys_enrich_data`.
 *
 * This is an implementation detail of the plugin, not a supported interface.
 * PixelYourSite publishes no hook for supplying this data, so a plugin update
 * can break it silently. Nothing else depends on this module, and the
 * WooCommerce attribution in `order-attribution.ts` is unaffected either way.
 */
const PYS_UNKNOWN = "undefined";

function pysUtm(a: Attribution): string {
  const pairs: Array<[string, string]> = [
    ["utm_source", a.utm_source],
    ["utm_medium", a.utm_medium],
    ["utm_campaign", a.utm_campaign],
    ["utm_term", a.utm_term],
    ["utm_content", a.utm_content],
  ];
  return pairs.map(([key, value]) => `${key}:${value || PYS_UNKNOWN}`).join("|");
}

/**
 * `pys_utm_id` is not a plain identifier — it is its own pipe-delimited string
 * holding the four ad-platform click ids, confirmed against a stored order. We
 * do not carry those, so every slot is `undefined`.
 */
function pysUtmId(): string {
  return ["fbadid", "gadid", "padid", "bingid"].map((k) => `${k}:${PYS_UNKNOWN}`).join("|");
}

/**
 * Build the `?pys_…` query string for an order-creating request.
 *
 * The bare prefix carries first touch and `last_pys_` carries the current
 * session, matching the plugin's own FIRST VISIT and LAST VISIT blocks.
 * Returns an empty string when there is nothing to send.
 */
export function pixelYourSiteQuery(state: AttributionState): string {
  const last = state.session;
  if (!last) return "";
  const first: Attribution = state.first ?? last;

  const query = new URLSearchParams({
    pys_landing: first.session_entry,
    pys_source: first.utm_source,
    pys_utm: pysUtm(first),
    pys_utm_id: pysUtmId(),
    last_pys_landing: last.session_entry,
    last_pys_source: last.utm_source,
    last_pys_utm: pysUtm(last),
    last_pys_utm_id: pysUtmId(),
  });

  return `?${query.toString()}`;
}
