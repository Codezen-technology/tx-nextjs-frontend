"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import { cn } from "@/lib/utils/cn";
import { isExternalUrl } from "@/lib/utils/url";

/**
 * The sitewide floating notice bar — page chrome carrying whatever the brand
 * currently needs to say.
 *
 * Right now that is the WP → Next.js migration: the site is being rebuilt page
 * by page, so a returning visitor can land on something that looks or behaves
 * differently from the WP site they used last week. Without a notice they
 * assume it is broken and say nothing, which is how the remaining migration
 * defects stay invisible to us. But the bar itself is generic — an intake
 * deadline or a service notice goes here too. Nothing about the migration is
 * hardcoded; the copy is a content edit on the WP side.
 *
 * Contract: `floating_bar` on `GET /settings`, owned by
 * `wp-lms-backend-rest-api` (`docs/SETTINGS_API.md` there is binding). The
 * backend decides whether there is a bar at all — unconfigured, switched off,
 * or an empty message all arrive as null — so this component never sees an
 * `enabled` flag to interpret.
 *
 * **Client component on purpose.** It reads `useSiteSettings()` — the settings
 * the root layout already fetched server-side and put on the provider — so this
 * adds no request of its own and cannot disagree with the copy the rest of the
 * tree renders from. Client components still render on the server, so the bar
 * is in the initial HTML rather than painted in after hydration. An async
 * server component calling `fetchSettings()` itself would look purer and cost a
 * network round trip, because that function is not React-`cache`d and so does
 * not dedupe against the calls the layout, footer and SEO helpers already make.
 *
 * Mounted per shell (`SiteShell`, `MinimalShell`, the `(auth)` layout) rather
 * than once in the root layout: the excluded surfaces — the dashboards and the
 * learn player — are route *groups*, which never appear in `usePathname()`, so a
 * central mount could only exclude them by hand-matching path prefixes that
 * break the moment a route moves.
 *
 * Known overlap: `ImpersonationBanner` is also `sticky top-0`, at a higher
 * z-index, so it covers this bar on scroll while an admin is impersonating.
 * Left alone deliberately — impersonation is an internal admin state and this
 * notice is addressed to visitors.
 */
export function SiteFloatingBar() {
  const { floating_bar: bar } = useSiteSettings();

  // `dismissKey` present IS "this bar may be dismissed" — the service layer
  // already collapsed the backend's `dismissible` + `dismiss_key` pair, so
  // there is nothing to re-derive here. An empty key keeps the bar out of the
  // dismissal path entirely: no storage read, no listener, nothing that can
  // differ between server and client.
  const dismissKey = bar?.dismissKey ?? "";
  const [dismissed, dismiss] = useDismissal(dismissKey);

  // Absent covers every "off" case — no bar configured, switched off, an empty
  // message, or a failed settings fetch. All of them are normalised to
  // undefined upstream so there is exactly one thing to check here.
  if (!bar || dismissed) return null;

  return (
    // No horizontal padding here: `container` supplies its own responsive
    // padding-inline, and doubling it would inset this bar further than the
    // header it sits above.
    <aside
      aria-label="Site notice"
      className="text-neutral-0 sticky top-0 z-40 w-full bg-neutral-900 py-2 text-sm"
    >
      <div className="container flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
        {/* Plain text, never dangerouslySetInnerHTML. The backend strips markup
            rather than escaping it precisely so no client needs an HTML sink. */}
        <p>{bar.message}</p>
        {bar.cta ? <BarCta href={bar.cta.href} label={bar.cta.label} /> : null}
        {dismissKey ? (
          <button
            type="button"
            aria-label="Dismiss this notice"
            className={cn(FOCUS_RING, "text-neutral-40 hover:text-neutral-0 ml-1 p-1")}
            onClick={dismiss}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </aside>
  );
}

/**
 * Shared focus treatment for the bar's controls. The offset colour has to match
 * the bar's own background, so it belongs with the bar rather than in a global
 * utility.
 */
const FOCUS_RING =
  "rounded-xs transition-colors focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:outline-none";

const STORAGE_KEY = "lms-floating-bar-dismissed";

/**
 * Same-tab subscribers. The `storage` event only fires in *other* tabs, so a
 * dismissal here has to notify this tab's own readers directly.
 */
const listeners = new Set<() => void>();

/** The dismiss key this device last recorded, or null. */
function readDismissedKey(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Safari private mode, storage disabled outright. Showing a notice the
    // visitor already dismissed beats crashing the page chrome.
    return null;
  }
}

/** Server render has no storage to read, so nothing is ever dismissed there. */
function serverSnapshot(): string | null {
  return null;
}

/**
 * Whether this exact bar has already been dismissed, plus the callback that
 * records a dismissal.
 *
 * Keyed on the backend's `dismiss_key`, a fingerprint of the bar's own copy:
 * dismissing January's offer must not hide February's, and that only works if
 * the stored value stops matching when the copy changes. Opaque by contract —
 * compared, never parsed.
 *
 * `useSyncExternalStore` rather than an effect writing state, because that is
 * exactly what it is for: `localStorage` is an external store, and the hook's
 * separate server snapshot lets the bar render into the SSR HTML without
 * claiming to know what the browser remembers. An effect would work but sets
 * state on every mount, which is a cascading render React now warns about.
 *
 * An empty key short-circuits both halves of the store, so a non-dismissible
 * bar reads no storage and registers no listener — its markup is then a pure
 * function of the settings response, identical on server and client.
 *
 * The visible cost, for dismissible bars only: one the visitor already closed
 * is in the server HTML and disappears just after hydration. Inherent to
 * server-rendering a bar whose dismissal only the client knows about.
 */
function useDismissal(dismissKey: string): [boolean, () => void] {
  // Tracked separately from the stored key so a refused write still hides the
  // bar for this page view. Reading storage cannot express that: it may hold a
  // *different* key from a previous notice, which is not null and so cannot be
  // fallen through on.
  const [dismissedHere, setDismissedHere] = useState(false);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!dismissKey) return () => {};
      listeners.add(onStoreChange);
      window.addEventListener("storage", onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
        window.removeEventListener("storage", onStoreChange);
      };
    },
    [dismissKey],
  );

  const getSnapshot = useCallback(() => (dismissKey ? readDismissedKey() : null), [dismissKey]);

  const stored = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, dismissKey);
    } catch {
      // Storage unavailable — the bar still goes away now and comes back on the
      // next page load, which beats a control that visibly does nothing.
    }
    setDismissedHere(true);
    listeners.forEach((notify) => notify());
  }, [dismissKey]);

  return [Boolean(dismissKey) && (dismissedHere || stored === dismissKey), dismiss];
}

const LINK_CLASS = cn(
  FOCUS_RING,
  "text-primary-300 hover:text-primary-100 font-semibold underline underline-offset-2",
);

/**
 * `next/link` for anything on our own origin, a new-tab anchor for genuinely
 * third-party destinations — the split the URL helpers document. The backend
 * serves a site-relative path or an absolute http(s) URL, and a WP-origin URL
 * was already rewritten to a path, so a remaining absolute URL really is
 * somewhere else.
 */
function BarCta({ href, label }: { href: string; label: string }) {
  if (isExternalUrl(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={LINK_CLASS}>
      {label}
    </Link>
  );
}
