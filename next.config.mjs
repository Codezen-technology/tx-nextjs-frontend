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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns },
  turbopack: { root: __dirname },
};

const sentryConfig = {
  silent: !process.env.SENTRY_DSN,
  hideSourceMaps: false,
};

export default withSentryConfig(withNextIntl(nextConfig), sentryConfig);
