import { env } from "@/lib/env";
import { decodeEntities } from "@/lib/api/parsers";
import { toFrontendPath } from "@/lib/utils/url";
import type {
  SiteSettings,
  SiteFeatures,
  ApiSiteSettings,
  RawFloatingBar,
  FloatingBar,
} from "@/types/settings";

/**
 * Default fallback settings — all pulled from env vars.
 *
 * Note the absence of `floating_bar`: it stays undefined on purpose. This is
 * what a failed `/settings` fetch resolves to, and a notice fabricated from a
 * fallback would be a sitewide banner nobody can switch off.
 */
export function getEnvFallbackSettings(): SiteSettings {
  return {
    site_name: env.SITE_NAME || "Training Excellence",
    logo_url: env.LOGO_URL || undefined,
    logo_dark_url: env.LOGO_DARK_URL || undefined,
    primary_color: env.PRIMARY_COLOR || undefined,
    accent_color: env.ACCENT_COLOR || undefined,
    currency: env.CURRENCY || "GBP",
    locale: env.LOCALE || "en-GB",
    features: {
      memberships: env.FEATURE_MEMBERSHIPS,
      bundles: env.FEATURE_BUNDLES,
      certificates: env.FEATURE_CERTIFICATES,
      badges: env.FEATURE_BADGES,
      reviews: env.FEATURE_REVIEWS,
      blog: env.FEATURE_BLOG,
    },
  };
}

/**
 * Narrow the raw `floating_bar` payload to something renderable, or `undefined`
 * — which the bar component reads as "do not render".
 *
 * The backend has already applied the real rules (see `docs/SETTINGS_API.md` in
 * `wp-lms-backend-rest-api`): unconfigured, switched off, or an empty message
 * all arrive as `null`, markup is stripped from the message, and a CTA missing
 * either half or carrying an unsafe href arrives as `cta: null`.
 *
 * The message and CTA-shape checks below are therefore about resilience rather
 * than distrust — what keeps a contract change, a stale plugin build, or a
 * filter someone added on the WP side from putting an empty strip on every
 * public page, since a bar with nothing to say still costs space above the fold
 * and reads as breakage. {@link safeBarHref} is the exception: it re-checks the
 * href on purpose, because that one's failure mode is script execution rather
 * than an ugly page.
 *
 * Entity decoding is ours to do: the backend strips tags but does not decode
 * entities, and this string is rendered as a text node, so an undecoded
 * `&amp;` would show the visitor its own source.
 */
export function normalizeFloatingBar(
  raw: RawFloatingBar | null | undefined,
): FloatingBar | undefined {
  if (!raw) return undefined;

  const message = decodeEntities(raw.message).trim();
  if (!message) return undefined;

  const href = safeBarHref(raw.cta?.href);
  const label = decodeEntities(raw.cta?.label).trim();

  // A bar is dismissible only if it also carries a key to remember the
  // dismissal by — a control whose choice cannot be recorded comes straight
  // back on the next page load, which is worse than no control. Collapsing the
  // two backend fields into one optional key means nothing downstream has to
  // re-derive that pairing.
  const dismissKey = raw.dismissible === false ? "" : (raw.dismiss_key ?? "").trim();

  return {
    message,
    // All-or-nothing: an href with no label renders no accessible name, a label
    // with no href renders dead text. Either half alone is dropped and the
    // message still shows — losing a link is no reason to withhold the notice.
    ...(href && label ? { cta: { href, label } } : {}),
    ...(dismissKey ? { dismissKey } : {}),
  };
}

/**
 * A CTA destination safe to put in an `href`, or `""`.
 *
 * The backend already rejects anything but a site-relative path or an http(s)
 * URL, and this repeats that check rather than trusting it — because the cost
 * of being wrong here is not a cosmetic one. `new URL("javascript:alert(1)")`
 * parses happily with an origin of `"null"`, which reads as "not our origin"
 * to `isExternalUrl()` and would render an executable `href` on every
 * visitor-facing page. Anyone able to write the WP option, or to add a
 * `lms_backend_api_floating_bar` filter, would have script execution.
 *
 * `toFrontendPath()` runs first so a WP-origin absolute URL becomes a path and
 * the bar never bounces a visitor back to the site we replaced.
 */
function safeBarHref(raw: string | null | undefined): string {
  const href = toFrontendPath(raw).trim();
  if (!href) return "";

  // `//host/path` is protocol-relative — someone else's origin wearing a path's
  // clothes — so it is not a site-relative path.
  if (href.startsWith("/")) return href.startsWith("//") ? "" : href;

  try {
    const { protocol } = new URL(href);
    return protocol === "http:" || protocol === "https:" ? href : "";
  } catch {
    return "";
  }
}

/** Merge API settings with env overrides. Env vars win when explicitly set. */
export function mergeSettings(api: ApiSiteSettings): SiteSettings {
  const fallback = getEnvFallbackSettings();

  const features: SiteFeatures = {
    ...fallback.features,
    ...(api.features ?? {}),
  };

  // Content links from the API arrive on the WP backend origin — rewrite to the
  // frontend so they don't bounce users to the old WP site.
  const membership_upsell = api.membership_upsell
    ? { ...api.membership_upsell, permalink: toFrontendPath(api.membership_upsell.permalink) }
    : api.membership_upsell;
  const promo_banner = api.promo_banner
    ? { ...api.promo_banner, button_url: toFrontendPath(api.promo_banner.button_url) }
    : api.promo_banner;

  // Must be assigned AFTER the `...api` spread below, or the raw backend shape
  // leaks straight through to components.
  const floating_bar = normalizeFloatingBar(api.floating_bar);

  return {
    ...fallback,
    ...api,
    membership_upsell,
    promo_banner,
    floating_bar,
    site_name: env.SITE_NAME || api.site_name || fallback.site_name,
    logo_url: env.LOGO_URL || api.logo_url || fallback.logo_url,
    logo_dark_url: env.LOGO_DARK_URL || api.logo_dark_url || fallback.logo_dark_url,
    primary_color: env.PRIMARY_COLOR || api.primary_color || fallback.primary_color,
    accent_color: env.ACCENT_COLOR || api.accent_color || fallback.accent_color,
    currency: env.CURRENCY || api.currency || fallback.currency,
    locale: env.LOCALE || api.locale || fallback.locale,
    features,
  };
}
