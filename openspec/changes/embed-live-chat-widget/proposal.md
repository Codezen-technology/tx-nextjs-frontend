## Why

The site has no live support channel: a visitor stuck on a course, a checkout, or a B2B licence question has only a contact form and an email round-trip. Codezen's own Custom Live Chat platform is built and deployed (`chat-widget.easychat.org.uk`), and it installs on a host site with a single `<script>` tag — so the missing piece is entirely on this side, and it is small.

Doing it now, before more route groups land, means one mount point rather than a retrofit across `(marketing)`, `(shop)`, `(student)`, `(business)` and `(learn)`.

## What Changes

- Mount the Custom Live Chat widget script once, in the root layout (`src/app/layout.tsx`), so it is present on every locale and every route group.
- Gate the mount on a new public env var, `NEXT_PUBLIC_LIVE_CHAT_WIDGET_URL`, surfaced through `src/lib/env.ts` like every other origin in this app. Unset means no script tag renders at all — that is the correct behaviour for CI, Playwright runs, and any preview deploy that must not reach a live agent inbox.
- Load with `next/script` at `afterInteractive`, so the widget never blocks first paint or competes with the LCP hero.
- Document the env var in `.env.example` and in `CLAUDE.md`'s environment list, alongside the operational prerequisite that lives in the chat platform, not here: a brand row whose `domain` equals this site's hostname, or the chat arrives untagged.
- No visitor identity is passed to the widget. A logged-in student still types their name and email into the widget's own pre-chat form.

Non-goals for this change:

- No prefill of the pre-chat form from the session. That would need a new host-API method on the chat platform (`window.EasyChat` exposes only `open`/`close`/`isOpen` today), which is cross-repo work.
- No custom "Chat with us" launcher. The widget's own bubble is the entry point.
- No per-route suppression in this codebase. Turning chat off for a URL is a page rule in the chat admin, which the widget honours _before_ it mounts its bubble — encoding the same decision twice, in two repos, is how the two drift.

## Capabilities

### New Capabilities

- `live-chat-widget-embed`: how and where the third-party live-chat script is loaded on this site — its single mount point, its env-var gate, its loading strategy, and the guarantee that no visitor PII crosses from this app into it.

### Modified Capabilities

None. No existing spec's requirements change: the widget renders into its own Shadow DOM host appended to `<body>`, and touches no page's markup, data flow, or metadata.

## Impact

- **Code**: `src/app/layout.tsx` (the mount), `src/lib/env.ts` (the new var), `.env.example`, `CLAUDE.md`.
- **Tests**: a Vitest unit test for the gate (absent var → no script; set var → script with the expected `src` and strategy); a Playwright spec asserting the widget's host element appears on a public page when the var is set.
- **Runtime dependencies**: adds one third-party script origin (`chat-widget.easychat.org.uk`) plus the chat API and Socket.io gateway origins that the bundle carries internally. No npm dependency is added.
- **Security/privacy**: the script is third-party JavaScript running on every page, including authenticated dashboards. It ships no `integrity` hash (the platform publishes a mutable stable URL by design), so the trust boundary is the vendor — which here is Codezen's own deployment. No CSP is configured in `next.config.mjs` today, so nothing needs relaxing; if one is added later, this origin must be in `script-src`, and the chat API/gateway origins in `connect-src`.
- **Performance**: one deferred external script; no effect on server rendering or on the static/ISR behaviour of any route.
