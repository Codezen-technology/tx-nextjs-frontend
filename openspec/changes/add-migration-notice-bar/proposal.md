## Why

The site is mid-migration from WordPress to this Next.js frontend, so visitors can land on a page that looks, behaves, or links differently from the `trainingexcellence.org.uk` they used last week — and today nothing on the page tells them that is expected. The result is silence rather than signal: a visitor who hits a rough edge assumes the site is broken, and we never hear about it. A persistent notice sets the expectation up front and gives people somewhere to send what they find, which is the only way the remaining migration defects reach us.

The notice is temporary by nature. It must be switchable off without a frontend deploy — otherwise it outlives the migration it announces.

**The backend already solves this.** `wp-lms-backend-rest-api` serves a `floating_bar` object on `GET /settings` (branch `floating-bar-notice-proposal`; `docs/SETTINGS_API.md` there is the binding contract). It is deliberately generic sitewide chrome — an intake deadline, a promotion, a service notice — and the migration notice is one thing to put in it. So this change is a _consumer_ of an existing contract, not a new one. An earlier draft of this proposal invented a parallel `migration_notice` field; that was duplicate work against a worse contract and has been dropped.

## What Changes

- **Render the sitewide floating bar** at the top of visitor-facing chrome, above the header, in normal document flow (`sticky top-0`) so it pushes content down rather than covering it — the same placement pattern as the existing `ImpersonationBanner`.
- **Consume `floating_bar` from `GET /settings`** exactly as the backend defines it: `message`, optional `cta` (`label` + `href`), `dismissible`, and a content-derived `dismiss_key`. The key is present on every response; `null` means no bar.
- **Honour `dismissible` and `dismiss_key`.** A dismissible bar gets a close button whose dismissal persists in `localStorage` against the key. Because the key is a fingerprint of the bar's own copy, an edited notice comes back for someone who dismissed the previous one. The two fields are collapsed into one optional `dismissKey` on the way in, since neither is meaningful without the other.
- **Mounted on public and auth chrome only** — `SiteShell` (marketing, product, order-confirmation, 404), `MinimalShell` (cart, checkout, certificate verification), and the `(auth)` layout. The student dashboard, business dashboard, and the full-screen learn player do not show it: those are signed-in working surfaces, not landing surfaces, and the learn player is a fixed-inset overlay with no room for it.
- No frontend copy, no frontend on/off switch, nothing migration-specific hardcoded. **Not a breaking change** — the field is additive, and its absence renders nothing.

## Capabilities

### New Capabilities

- `site-floating-bar`: when and where the sitewide floating bar renders, how it consumes the backend's `floating_bar` contract, how it degrades when that content is missing or malformed, how dismissal behaves across content edits, and its accessibility and layout contract.

### Modified Capabilities

<!-- None. `seo-metadata` and the header/footer navigation specs are untouched: the
     bar adds a landmark outside <main> and changes no page metadata, no canonical,
     and no navigation requirement. -->

## Impact

**Frontend (this repo)**

- New component `src/components/layout/site-floating-bar.tsx`.
- Mount points: `src/components/layout/site-shell.tsx`, `src/components/layout/minimal-shell.tsx`, `src/app/[locale]/(auth)/layout.tsx`.
- `src/types/settings.ts` — `RawFloatingBar` / `FloatingBar` interfaces, optional `floating_bar` on `SiteSettings`, and an `ApiSiteSettings` type for the raw payload.
- `src/lib/services/settings.ts` — `normalizeFloatingBar()` wired into `mergeSettings()` (entity-decode the message, rewrite a WP-origin CTA href via `toFrontendPath`, reject any CTA href that is not a site-relative path or an `http(s)` URL, drop a half-configured CTA, drop the bar when it has nothing to say).
- `API_REFERENCE.md` — document the `/settings` payload and point at the backend's binding contract.
- Unit tests for the normalizer, the component, and the dismissal rules.

**Backend (`wp-lms-backend-rest-api`, separate repo — not implemented here)**

- `Floating_Bar` + the `floating_bar` key already exist on branch `floating-bar-notice-proposal`, 20/22 tasks done but **uncommitted**, so the live endpoint does not serve it yet.
- TX has no `sites/tx/options/lms_floating_bar.json`, so TX resolves to `null` until someone writes one. That file is where the migration copy and `"dismissible": false` go.

**Risk / accepted tradeoffs**

- `ImpersonationBanner` is also `sticky top-0` at a higher z-index. While an admin is impersonating, the two overlap on scroll. Accepted: impersonation is an internal admin state, and the bar is aimed at visitors.
- A _dismissible_ bar the visitor already closed is in the server HTML and disappears just after hydration. Inherent to server-rendering a bar whose dismissal only the client knows about. Costs nothing for the notice TX will actually ship, which is seeded `"dismissible": false` and never reads storage.
- The bar consumes vertical space above the fold on every public page, including the homepage hero. Copy must stay to one line at desktop width.
