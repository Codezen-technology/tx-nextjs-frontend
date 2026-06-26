import { env } from "@/lib/env";
import { toFrontendPath } from "@/lib/utils/url";
import type { SiteSettings, SiteFeatures } from "@/types/settings";

/** Default fallback settings — all pulled from env vars. */
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

/** Merge API settings with env overrides. Env vars win when explicitly set. */
export function mergeSettings(api: Partial<SiteSettings>): SiteSettings {
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

  return {
    ...fallback,
    ...api,
    membership_upsell,
    promo_banner,
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
