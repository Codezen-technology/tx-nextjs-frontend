function boolFlag(v: string | undefined, fallback = true): boolean {
  if (v === undefined) return fallback;
  return v !== "false" && v !== "0";
}

export const env = {
  WP_API_URL: process.env.NEXT_PUBLIC_WP_API_URL ?? "",
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  LMS_NAMESPACE: process.env.NEXT_PUBLIC_LMS_NAMESPACE ?? "lms-backend/v1",
  CDN_URL: process.env.NEXT_PUBLIC_CDN_URL ?? "",

  // Payments
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",

  // Monitoring
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "",

  // On-demand ISR
  WP_REVALIDATE_SECRET: process.env.WP_REVALIDATE_SECRET ?? "",

  // WooCommerce REST API v3 Consumer Keys (server-only — never NEXT_PUBLIC_)
  WC_CONSUMER_KEY: process.env.WC_CONSUMER_KEY ?? "",
  WC_CONSUMER_SECRET: process.env.WC_CONSUMER_SECRET ?? "",

  // Stripe server-side secret key (server-only)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",

  // Newsletter integration
  NEWSLETTER_PROVIDER_API_KEY: process.env.NEWSLETTER_PROVIDER_API_KEY ?? "",

  // Optional site identity overrides (fallback to /settings endpoint)
  SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME ?? "",
  LOGO_URL: process.env.NEXT_PUBLIC_LOGO_URL ?? "",
  LOGO_DARK_URL: process.env.NEXT_PUBLIC_LOGO_DARK_URL ?? "",
  PRIMARY_COLOR: process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? "",
  ACCENT_COLOR: process.env.NEXT_PUBLIC_ACCENT_COLOR ?? "",
  CURRENCY: process.env.NEXT_PUBLIC_CURRENCY ?? "GBP",
  LOCALE: process.env.NEXT_PUBLIC_LOCALE ?? "en-GB",

  // Feature flag env overrides (fallback to /settings endpoint; true by default)
  FEATURE_MEMBERSHIPS: boolFlag(process.env.NEXT_PUBLIC_FEATURE_MEMBERSHIPS),
  FEATURE_BUNDLES: boolFlag(process.env.NEXT_PUBLIC_FEATURE_BUNDLES),
  FEATURE_CERTIFICATES: boolFlag(process.env.NEXT_PUBLIC_FEATURE_CERTIFICATES),
  FEATURE_BADGES: boolFlag(process.env.NEXT_PUBLIC_FEATURE_BADGES, false),
  FEATURE_REVIEWS: boolFlag(process.env.NEXT_PUBLIC_FEATURE_REVIEWS),
  FEATURE_BLOG: boolFlag(process.env.NEXT_PUBLIC_FEATURE_BLOG),
} as const;

export const WP_REST_BASE = env.WP_API_URL
  ? `${env.WP_API_URL.replace(/\/$/, "")}/wp-json`
  : "";

/** Server-side WordPress origin (no /wp-json). Uses private WP_API_URL env when set. */
export function getServerWpOrigin(): string {
  const fromServer = process.env.WP_API_URL?.replace(/\/$/, "");
  if (fromServer) return fromServer;
  return env.WP_API_URL.replace(/\/$/, "");
}

export function getServerWpJsonBase(): string {
  const origin = getServerWpOrigin();
  return origin ? `${origin}/wp-json` : "";
}
