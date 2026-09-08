## 1. Settings contract

- [x] 1.1 Add `RawFloatingBar` (`message`, `cta`, `dismissible`, `dismiss_key`) and render-ready `FloatingBar` interfaces to `src/types/settings.ts`, plus optional `floating_bar` on `SiteSettings` and an `ApiSiteSettings` type for the raw payload.
- [x] 1.2 Add `normalizeFloatingBar()` in `src/lib/services/settings.ts`: `undefined` unless the entity-decoded message is non-empty; CTA kept only when both `label` and a safe `href` survive (see 6.1); `dismissible` + `dismiss_key` collapsed into one optional `dismissKey` (see 6.3).
- [x] 1.3 Wire the helper into `mergeSettings()` alongside the existing `promo_banner` / `membership_upsell` normalization so the raw `...api` spread cannot leak an unnormalized value through.
- [x] 1.4 Confirm `getEnvFallbackSettings()` leaves `floating_bar` undefined — a failed settings fetch must never fabricate a bar.
- [x] 1.5 Point `settings.server.ts` at `ApiSiteSettings` so the raw payload is typed distinctly from the normalized one.
- [x] 1.6 Document the `/settings` payload and the `floating_bar` object in `API_REFERENCE.md`, linking to `docs/SETTINGS_API.md` in `wp-lms-backend-rest-api` as the binding contract.

## 2. Component

- [x] 2.1 Create `src/components/layout/site-floating-bar.tsx` as a `"use client"` component reading `useSiteSettings()`; return `null` when `floating_bar` is absent.
- [x] 2.2 Render `<aside aria-label="Site notice">` with `sticky top-0 z-40` in normal flow, a `<p>` holding the message as a text node (no `dangerouslySetInnerHTML`), and — when the CTA survived — a `next/link` for internal hrefs or a `target="_blank" rel="noopener noreferrer"` anchor for third-party ones.
- [x] 2.3 Implement dismissal via `useSyncExternalStore` over `localStorage`, keyed on `dismissKey`: control rendered only when a key is present, dismissal hides the whole bar, and a refused storage write still hides it for the current page view (see 6.2 for how that fallback ended up).
- [x] 2.4 Style with existing design tokens; verify text and link colours meet WCAG AA against the bar background. Copy sits on one line at desktop width and wraps (not truncates) at mobile.
- [x] 2.5 Add a component doc comment covering why it is client-side, why the contract is the backend's, the `useSyncExternalStore` choice, and the accepted `ImpersonationBanner` overlap.

## 3. Mount points

- [x] 3.1 Mount as the first child of `src/components/layout/site-shell.tsx`, above `ImpersonationBanner`.
- [x] 3.2 Mount as the first child of `src/components/layout/minimal-shell.tsx`, above `MinimalHeader`.
- [x] 3.3 Mount as the first child of `src/app/[locale]/(auth)/layout.tsx`, above `ImpersonationBanner`.
- [x] 3.4 Confirm by inspection that no dashboard, business-dashboard, or learn-player layout picks it up transitively — `(student)`, `(business)`, and `(learn)` must stay untouched.

## 4. Tests

- [x] 4.1 `src/__tests__/floating-bar.test.tsx` covering `normalizeFloatingBar()`: null/absent/empty-message → `undefined`; entity-encoded message → decoded; site-relative, WP-origin and external CTA hrefs; CTA missing either half → dropped, message kept; `dismissible` default and explicit `false`; missing `dismiss_key`.
- [x] 4.2 Component tests inside `SiteSettingsProvider`: renders nothing when there is no bar; renders the message; complementary landmark with the expected accessible name; internal vs new-tab CTA; message rendered as text not markup.
- [x] 4.3 Dismissal tests: no control when not dismissible or when the key is missing; clicking hides the whole bar; dismissal survives a remount; a changed key brings the bar back; a non-dismissible bar shows even with a matching stored key.
- [x] 4.4 Run `pnpm typecheck`, `pnpm lint`, and `pnpm test`.

## 5. Verification

- [x] 5.1 With a bar injected, load a marketing page, cart and login — bar present above the header on each, content pushed down rather than covered, still pinned while scrolling.
- [x] 5.2 Confirm the excluded surfaces do not mount it — `DashboardShell` and `BusinessShell` pull in neither shell nor the bar, and `(learn)/layout.tsx` imports only `ImpersonationBanner`.
- [x] 5.3 View source on a public page and confirm the bar's markup is in the server-rendered HTML; check the browser console for hydration warnings.
- [x] 5.4 With `dismissible: false`, confirm no dismiss control renders and nothing changes after hydration.
- [x] 5.5 With `dismissible: true`, confirm the control appears, clicking it hides the whole bar, the key is written to `localStorage`, and the bar stays hidden across a full page reload.
- [x] 5.6 Confirm no bar renders against the real backend, which does not serve `floating_bar` yet.

## 6. Review fixes

- [x] 6.1 **Security:** reject CTA hrefs that are not a site-relative path or an `http(s)` URL. `new URL("javascript:alert(1)")` parses with origin `"null"`, which `isExternalUrl()` reads as third-party, so the unvalidated href reached `<a href>` — script execution for anyone able to write the WP option or add a `lms_backend_api_floating_bar` filter. Added `safeBarHref()` in the normalizer plus regression tests for `javascript:`, `data:`, `vbscript:`, mixed case, padded, and protocol-relative.
- [x] 6.2 Fix the storage-failure fallback. The module-level `memoryFallback` was read via `??`, which only falls through on `null` — so a stale key from a previous notice (not null) won the comparison and the dismiss control did nothing. Replaced with per-view component state OR'd against the stored key, dropping the module state entirely. Covered by a test that seeds a different key and then makes the write throw.
- [x] 6.3 Collapse `dismissible` + `dismissKey` into one optional `dismissKey` on `FloatingBar`, present only when the bar may be dismissed AND has a key. Removes the data clump the component was re-deriving, and lets a non-dismissible bar skip the store entirely.
- [x] 6.4 Make the "reads no client-side storage" claim true for non-dismissible bars: `subscribe` and `getSnapshot` short-circuit on an empty key, so no `getItem` call and no `storage` listener. Asserted with a spy.
- [x] 6.5 Drop `px-4` from the `<aside>` — the `container` utility already applies a responsive `padding-inline`, so the bar was inset further than the header below it.
- [x] 6.6 Extract the repeated focus-ring cluster into a `FOCUS_RING` constant shared by the CTA link and the dismiss button, composed with `cn()`.
- [x] 6.7 Correct the component doc comment: settings are fetched server-side but not _once_ — `fetchSettings()` runs in `layout.tsx` twice plus `footer.tsx` and `seo/server.ts`, and is not React-`cache`d. The zero-extra-fetch argument stands; "once" did not.
- [x] 6.8 Flag `floating_bar` as not-yet-live in `API_REFERENCE.md` and trim the backend-owned authoring detail (seed path, deploy script, `enabled` flag) that duplicated `docs/SETTINGS_API.md`.
- [x] 6.9 Widen the spec's mount-surface scenarios to match reality — `MinimalShell` also serves certificate verification, `SiteShell` also serves the 404 page — and add scenarios for unsafe CTA schemes, the no-storage guarantee, and horizontal alignment with the header.
