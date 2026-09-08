## Context

See `proposal.md` — Why. The constraints that actually shape the approach:

- **The contract is not ours.** `wp-lms-backend-rest-api` owns `floating_bar` on `GET /settings`; `docs/SETTINGS_API.md` in that repo is binding. It arrives as `{ message, cta: {label, href} | null, dismissible, dismiss_key }`, or `null`, and **the key is present on every response** once shipped. The backend has already resolved the on/off decision, stripped markup from the message, and dropped an unsafe or half-configured CTA before we see it — which we deliberately do not treat as a reason to skip our own checks; see the CTA decision below.
- Site settings are fetched server-side via `fetchSettings()`, normalized by `mergeSettings()`, and handed to the client tree through `SiteSettingsProvider` in `src/app/layout.tsx`. Any component under that provider reads them with `useSiteSettings()` at **zero additional network cost**. Note that `fetchSettings()` is not React-`cache`d and already runs several times per request (twice in `layout.tsx`, plus `footer.tsx` and `seo/server.ts`) — reading the provider avoids adding to that, it does not make the fetch singular.
- There is no single layout wrapping exactly "public + auth and nothing else". Chrome is assembled per route group: `SiteShell`, `MinimalShell`, `(auth)/layout.tsx`, plus dashboard and learn-player shells we must not touch. The existing `ImpersonationBanner` solves the same shape by being mounted at each shell that wants it.
- `ImpersonationBanner` already occupies `sticky top-0 z-50` on those same shells.
- `mergeSettings()` spreads the raw API object (`...api`) and then selectively normalizes a few fields — an untrusted new field would otherwise reach components raw.

## Goals / Non-Goals

**Goals:**

- Consume the backend contract as written, including the parts we did not ask for (`dismissible`, `dismiss_key`), so a future brand that flips them gets working behaviour rather than a silent no-op.
- Correct markup in the server-rendered HTML — the bar is in the first paint, not painted in after hydration.
- All content handling in the service layer, so the component is a pure render of an already-valid object.

**Non-Goals:**

- The backend field, the `Floating_Bar` resolver, and the per-brand seed JSON. Owned by `wp-lms-backend-rest-api`.
- Any per-route or per-page targeting. Mount points are the granularity.
- Scheduling. The backend deliberately has none — the bar is on until someone switches it off.

## Decisions

### Consume `floating_bar`; do not invent a parallel field

An earlier draft of this change specified a `migration_notice` field of its own — a different name, a different link shape, an `enabled` flag in the response, and no dismissal. It was written before checking the backend, which already had `floating_bar` in flight covering the same need more generally.

Dropped entirely. Two fields for one strip of chrome means two contracts to keep in sync and a second admin path for editors, and `floating_bar` is the better of the two: it is generic (a migration notice is just today's content), and its `dismiss_key` solves an expiry problem the invented field had no answer for.

_Consequence:_ this change is blocked on backend work that is written but uncommitted. That is fine — the field's absence renders nothing, so the frontend ships safely first.

### Client component reading `useSiteSettings()`, not a server component fetching settings

The bar is a `"use client"` component calling `useSiteSettings()`.

_Why:_ client components still render on the server during SSR, so the bar is present in the initial HTML — the requirement is "in first paint", not "server component". Reading the existing provider means **zero extra fetch** and no second code path that could disagree with the root layout's copy of the settings. It is also the only option once dismissal is in scope, since that needs client state.

_Alternative rejected:_ an async server component calling `fetchSettings()` itself. That function is not React-`cache`d, so it risks a second request per render, and it would force `(auth)/layout.tsx` — currently synchronous — to become async for no benefit.

### Mount at each shell, not once in the root layout

Three call sites: `site-shell.tsx`, `minimal-shell.tsx`, `(auth)/layout.tsx` — first child, above `ImpersonationBanner` where that exists.

_Alternative rejected:_ mount once in `src/app/layout.tsx` and hide on excluded routes via `usePathname()`. That puts route knowledge inside a presentational component, silently breaks when a route moves between groups, and cannot see route _groups_ at all — they are absent from the pathname — so the exclusion list would be a hand-maintained prefix match.

### Normalize in `mergeSettings()`, render nothing on anything unusable

`normalizeFloatingBar()` returns `undefined` unless the payload yields a non-empty message, and otherwise returns a render-ready object: message entity-decoded, CTA kept only when both halves survive (`href` through `toFrontendPath()` then a scheme check), and the backend's `dismissible` + `dismiss_key` collapsed into a single optional `dismissKey`.

_Why here:_ it is where `promo_banner` and `membership_upsell` are already normalized, and it means the component's guard is a single `if (!bar) return null`. Putting the checks in the component would spread WP-shape knowledge into the render layer, which the repo's service-layer rule forbids.

_Not a second opinion on the backend._ The backend guarantees a non-empty message and a safe CTA. These checks exist so a stale plugin build or a WP-side `lms_backend_api_floating_bar` filter cannot put an empty strip above the fold on every public page.

_Entity decoding is genuinely ours._ The backend runs `wp_strip_all_tags()`, which removes markup but does not decode entities, and we render the message as a text node — so an undecoded `&amp;` would show the visitor its own source.

_Message is plain text._ Rendered as a text node, no `dangerouslySetInnerHTML`. The backend strips rather than escapes markup precisely so no client needs an HTML sink.

### The CTA href is scheme-checked here, even though the backend checks it

`safeBarHref()` accepts a site-relative path or an `http(s)` URL and rejects everything else.

Duplicating a backend check is normally waste. Not here: `new URL("javascript:alert(1)")` parses successfully with an origin of `"null"`, and `isExternalUrl()` reads "not our origin" as "third-party", so an unvalidated value would render `<a href="javascript:…" target="_blank">` on every visitor-facing page. The blast radius is script execution for anyone who can write the WP option or register a `lms_backend_api_floating_bar` filter — so this is the one place where "the backend already guarantees it" is not a good enough reason to skip a check.

The earlier draft applied that defence-in-depth reasoning only to the cosmetic case (an empty message) and not the security one. Inconsistent, and the inconsistency was the defect.

### `dismissible` + `dismiss_key` collapse into one optional `dismissKey`

The two backend fields only mean anything together: a dismissible bar with no key returns on the next page load, and a key on a non-dismissible bar is never read. Carrying both forward made every consumer re-derive the pairing.

`FloatingBar.dismissKey` is present only when the bar may be dismissed _and_ has a key. Its presence IS "render a dismiss control", which also gives the component a single value to short-circuit the store on.

### `useSyncExternalStore` for the dismissal, not an effect

Dismissal state comes from `useSyncExternalStore` over `localStorage`, OR'd with a per-view `useState` flag.

_Why the hook:_ `localStorage` is an external store and this is what React provides for reading one, including the separate server snapshot that lets the bar render into SSR HTML without pretending to know what the browser remembers. The obvious alternative — `useState` plus an effect that reads storage on mount — sets state on every mount, which is a cascading render the repo's lint rules now flag.

_Subscription covers both directions:_ a `storage` event listener picks up a dismissal in another tab, and a module-level listener set picks up this tab's own write, which `storage` never fires for.

_An empty key short-circuits both `subscribe` and `getSnapshot`_, so a non-dismissible bar reads no storage and registers no listener. Its markup is then a pure function of the settings response — which is what makes the "identical on server and client" guarantee true rather than merely likely.

_Why the extra state flag:_ a refused write (Safari private mode, quota) must still hide the bar for the current page view, and reading storage cannot express that. An earlier attempt kept a module-level `memoryFallback` and read `localStorage.getItem(...) ?? memoryFallback` — but `??` only falls through on `null`, so a _stale key from a previous notice_ won the comparison and the dismiss control silently did nothing. Per-view state OR'd against the stored key has no such hole and needs no module state at all.

_Accepted cost:_ a **dismissible** bar the visitor already closed is in the server HTML and disappears just after hydration. Inherent to server-rendering a bar whose dismissal only the client knows about; the alternative is withholding the bar from SSR entirely, which is worse for everyone who has not dismissed it. Costs nothing for the notice TX will ship, which is `"dismissible": false`.

### Layout: `sticky top-0`, below `ImpersonationBanner`'s z-index

`sticky top-0 z-40` in normal flow, mirroring `ImpersonationBanner`'s sticky variant, rendered _before_ it in DOM order so it is topmost in the normal case.

_Accepted overlap:_ while an admin impersonates, both are `sticky top-0` and the impersonation banner (`z-50`) covers the bar on scroll. Not worth solving — impersonation is an internal admin state, and the alternative is a CSS offset variable coupling two independent banners.

### Markup and accessibility

`<aside aria-label="Site notice">` containing a `<p>`, an optional link, and an optional icon button labelled `"Dismiss this notice"`. `aside` outside `<main>` gives a labelled complementary landmark for free. Not a live region — it is present at load, so `role="status"` would be a lie and could interrupt.

Horizontal insets come from the shared `container` utility alone. The `aside` carries no `px-*` of its own: `container` already applies a responsive `padding-inline` from the page grid, and adding to it indented the bar further than the header directly beneath it.

## Risks / Trade-offs

- **Bar pushes the homepage hero down on every public page** → keep copy to one line at desktop width; it wraps rather than truncating at mobile. Vertical cost is the price of being seen at all.
- **Backend field ships late or changes shape** → the normalizer treats anything unrecognised as "no bar", so the worst case is the bar not appearing, never a broken page. Unit tests cover the malformed shapes explicitly.
- **The bar outlives the migration** → removal is a content edit (`enabled: false` in the seed file, or deleting it), not a deploy. Worth noting in the migration cutover checklist.
- **Editor pastes HTML into the message** → the backend strips it; anything that survives renders as literal visible text. Ugly and obvious, which is the right failure mode.
- **Dismissal is per-device, not per-user** → `localStorage`, so it does not follow a visitor across browsers. Correct for an anonymous visitor notice, and the backend's key is deliberately user-independent so the response stays publicly cacheable.

## Migration Plan

1. Land the frontend change. With `floating_bar` absent or `null`, nothing renders — safe to deploy independently and in any order.
2. Backend: commit and ship the `floating-bar-notice-proposal` branch (separate repo).
3. Add `sites/tx/options/lms_floating_bar.json` with the migration copy and `"dismissible": false`, then apply with `scripts/apply-site-config.sh`.
4. **Rollback:** set `"enabled": false` in that file and re-apply, or delete it. No frontend deploy.
5. **End of migration:** same as rollback. The component stays — it is generic chrome, reusable for the next announcement.
