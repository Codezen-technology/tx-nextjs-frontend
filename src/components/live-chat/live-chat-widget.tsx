import Script from "next/script";
import { env } from "@/lib/env";

/**
 * The site's single mount point for Codezen's Custom Live Chat widget.
 *
 * The whole component is a gate plus one script tag, and both halves are
 * deliberate:
 *
 * - **Empty URL renders nothing.** Not a hidden widget, not a disabled one —
 *   no tag and therefore no request to any chat origin. The widget reaches a
 *   real agent inbox, so every environment nobody has configured on purpose
 *   (CI, Playwright, preview deploys) is off by construction rather than by
 *   someone remembering.
 * - **`afterInteractive`, not `lazyOnload`.** `next/script` de-duplicates by
 *   `src`, so the bundle executes once per session and survives client
 *   navigation without re-running. `lazyOnload` would defer to browser idle,
 *   which delays the launcher unpredictably on a busy page — and the widget
 *   still has its own routing-status round-trip to make before it can decide
 *   whether to show anything at all.
 *
 * Nothing about the visitor crosses this boundary. No name, email, user id or
 * session token is passed; identifying the visitor is the widget's own
 * pre-chat form. The tag carries origin configuration and nothing else — the
 * published bundle already knows its chat API and gateway origins, and which
 * brand a chat belongs to is resolved by the chat platform from this site's
 * hostname, not from anything this page says.
 *
 * Where the widget appears is a page rule in the chat admin, which the widget
 * checks before mounting its launcher. Do not add route conditions here: the
 * same decision living in two repos is how the two drift.
 *
 * NOTE for whoever adds a Content-Security-Policy (`next.config.mjs` sets no
 * `headers()` today): `script-src` must list the widget origin, and
 * `connect-src` the chat API and Socket.io gateway origins the bundle talks
 * to, or chat breaks silently.
 */
export function LiveChatWidget() {
  if (!env.LIVE_CHAT_WIDGET_URL) return null;

  return <Script src={env.LIVE_CHAT_WIDGET_URL} strategy="afterInteractive" />;
}
