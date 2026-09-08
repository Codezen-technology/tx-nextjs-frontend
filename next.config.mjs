import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Bypass TLS verification when backend is a local .test domain (Valet self-signed cert).
// Safe: real production WP_API_URL never contains ".test" or "localhost".
const _wpApiUrl = process.env.NEXT_PUBLIC_WP_API_URL ?? "";
const _isLocalBackend =
  _wpApiUrl.includes(".test") || _wpApiUrl.includes("localhost") || _wpApiUrl.includes("127.0.0.1");

if (process.env.NODE_ENV !== "production" || _isLocalBackend) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const wpUrl = process.env.NEXT_PUBLIC_WP_API_URL;
const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;

function parseHostname(url) {
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

const wpHost = parseHostname(wpUrl);
const cdnHost = parseHostname(cdnUrl);

const remotePatterns = [];
if (wpHost) {
  remotePatterns.push({ protocol: "https", hostname: wpHost });
  remotePatterns.push({ protocol: "http", hostname: wpHost });
}
if (cdnHost && cdnHost !== wpHost) {
  remotePatterns.push({ protocol: "https", hostname: cdnHost });
}
remotePatterns.push({ protocol: "https", hostname: "secure.gravatar.com" });
remotePatterns.push({ protocol: "https", hostname: "*.wp.com" });
// WordPress offloads uploads to S3, so media URLs come back on this host rather
// than NEXT_PUBLIC_WP_API_URL's. Required for any next/image rendering WP media.
remotePatterns.push({
  protocol: "https",
  hostname: "trainingexcellence-media.s3.eu-west-2.amazonaws.com",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns,
    // Dev machines on NAT64/DNS64 networks resolve public S3 hosts to
    // `64:ff9b::/96` IPv6 addrs, which Next 16 misflags as local IPs and
    // blocks (SSRF guard). Allow only in dev — never in production.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
  turbopack: { root: __dirname },
  async redirects() {
    // Legacy WordPress URLs retired by the headless cutover. Sourced from the live
    // sitemap_index.xml audit — see .migration/URL_MAP.md for the full inventory and
    // the evidence behind each mapping. Every entry is emitted twice: once bare and
    // once under /:locale, because localePrefix is "as-needed" (src/i18n/routing.ts).
    const legacy = {
      // Duplicate content — two WP pages for the same thing.
      "/cancellations-and-refunds": "/cancellations",
      "/help-and-faqs": "/help",
      "/policies-and-terms-of-use": "/terms-and-conditions",
      "/registration": "/register",

      // BuddyPress leftovers with no headless equivalent.
      "/lostpassword": "/forgot-password",
      "/activate-2": "/login",
      "/activity": "/dashboard",
      "/members-directory": "/dashboard",

      // WooCommerce / legacy LMS surfaces replaced by Next routes.
      "/my-account": "/dashboard",
      "/student-portal": "/dashboard",
      "/course-player": "/dashboard/my-learning",
      "/shop": "/all-courses",
      "/thank-you-for-ordering-certificate": "/certificate",
      // NOTE: `/hardcopy-certificate` is NOT redirected — it is its own page. The
      // live WP site sells a separate hardcopy-led offer there (different Gravity
      // Form, hardcopy required, digital optional), so pointing it at /certificate
      // landed every inbound link on the wrong offer.

      // Elementor pages that render only global header/footer chrome — zero unique
      // body content on the live site (verified: 12-token diff between them, all title).
      "/force-for-good": "/about-us",
      "/resources": "/help",
      "/training-teams": "/business-dashboard",
      "/write-for-us": "/contact-us",

      // Superseded business-dashboard route.
      "/business-dashboard/credits/transactions": "/business-dashboard/licences",
    };

    // TODO before cutover — these have real content, so a redirect loses it.
    // Decide build-vs-redirect once GSC impressions are checked:
    //   /sitemap/                                (132,588 chars)
    //   /course-selector-page/                   (24,364 chars)
    //   /blog/contributed-expert/hasibul-kabir/  (contributed-expert CPT)

    return Object.entries(legacy).flatMap(([source, destination]) => [
      { source, destination, permanent: true },
      { source: `/:locale${source}`, destination: `/:locale${destination}`, permanent: true },
    ]);
  },
};

const sentryConfig = {
  silent: !process.env.SENTRY_DSN,
  hideSourceMaps: false,
};

export default withSentryConfig(withNextIntl(nextConfig), sentryConfig);
