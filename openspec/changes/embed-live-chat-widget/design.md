## Context

See `proposal.md` — Why. What shapes the approach here is what the chat platform already decided, and what this repo already does with external origins.

From the chat platform (Codezen's `code-live-chat`, deployed):

- The published bundle carries its own API and Socket.io gateway origins, baked in at build time. A host site needs the script tag and nothing else. `data-api-url` / `data-gateway-url` attributes still override, which is what a local stack uses.
- The chat is attributed to a brand server-side, from the `Origin` header's **hostname** matched against a `brands.domain` row — no scheme, no port, and nothing the page supplies. An unmatched hostname yields an untagged chat, never a refusal.
- The widget asks the chat API whether chat is enabled for the current URL _before_ it mounts a launcher, so a "turn chat off" page rule hides it from first paint.
- The bundle mounts its own Shadow DOM host on `<body>`, carrying `data-live-chat-widget`, and publishes a frozen `window.EasyChat` (`open`/`close`/`isOpen`) plus an `easychat:ready` event. Neither is needed here.
- The chat API and gateway both accept any origin (`origin: true` / `"*"`), so there is no allowlist to coordinate before this ships.

From this repo:

- Every external origin is read through `src/lib/env.ts`, never `process.env` at a call site.
- `src/app/layout.tsx` is an async server component wrapping `Providers` and `SiteSettingsProvider`; it is the only layout above all locales and all route groups.
- `next.config.mjs` sets no `headers()` and no CSP.
- Vitest runs jsdom over `src/**` with Testing Library; Playwright runs `e2e/*.spec.ts` against a running dev server and loads `.env.local` into the test process itself.

## Goals / Non-Goals

**Goals:**

- One mount point, so "where does chat appear" has a single answer in this codebase.
- A configuration gate that is unit-testable without rendering an async server layout.
- Failure of the third-party script contained to the widget.

**Non-Goals:**

- Any abstraction over the chat vendor. One script tag from one vendor does not earn an adapter.
- Wrapping `window.EasyChat`. Nothing in this app calls it yet; typing and wrapping an API with no caller is speculative surface.
- Route-aware rendering logic (see the spec's "Suppressing chat for a URL is a chat-platform decision").

## Decisions

### 1. Mount in the root layout, via a small dedicated component

`src/app/layout.tsx` renders `<LiveChatWidget />` — a new component under `src/components/live-chat/live-chat-widget.tsx` that reads `env.LIVE_CHAT_WIDGET_URL`, returns `null` when it is empty, and otherwise returns a `next/script` element.

The component exists for one reason: the root layout is an async server component that awaits `fetchSettings()`, which makes it clumsy to unit-test the gate. A plain synchronous component is a two-line render in Vitest, and the two scenarios ("URL not configured" / "URL configured") become two assertions.

_Alternative — inline the `<Script>` in the layout:_ fewer files, but the gate then has no test that isn't a settings-fetch mock. Rejected on testability.

_Alternative — mount per route group:_ rejected in the proposal; it multiplies the mount points that must stay in step and gives an authenticated area no chat.

### 2. `next/script` with `strategy="afterInteractive"`

`afterInteractive` injects the script once hydration has run, and — importantly for an SPA — `next/script` de-duplicates by `src`, so client navigation between routes does not re-execute the bundle. That is the spec's "loaded once for the session".

_Alternative — `lazyOnload`:_ defers to browser idle. Tempting for a support widget, but it delays the launcher unpredictably on a busy page, and this widget must also run its routing-status check before it can decide to show nothing. `afterInteractive` is the right side of that trade.

_Alternative — a raw `<script src defer>` in the layout:_ Next warns against it and it re-renders across navigations.

Note for whoever adds per-site overrides later: `next/script` spreads unknown props onto the element, so `data-api-url` / `data-gateway-url` work if a deployment ever needs them. Nothing in this change passes them — the production bundle already carries its origins.

### 3. Env var named for the script, defaulting to empty

`NEXT_PUBLIC_LIVE_CHAT_WIDGET_URL`, exposed as `env.LIVE_CHAT_WIDGET_URL` with `?? ""`, matching how `CDN_URL` and `SENTRY_DSN` are handled in the same file.

Empty-means-off is the important half. It makes "don't reach a live agent inbox" the default for every environment nobody has deliberately configured — CI, Playwright, preview deploys — rather than something each has to remember to switch off. The production value is `https://chat-widget.easychat.org.uk/widget.js`; a local chat stack sets `http://localhost:4321/widget.js`.

_Alternative — a boolean feature flag plus a hard-coded URL:_ two things to set, and the URL then lives in a component. Rejected.

_Alternative — `NEXT_PUBLIC_FEATURE_LIVE_CHAT` in the existing feature-flag family:_ those default to `true`, which is exactly the wrong default for a third-party script that talks to a real inbox.

### 4. No `integrity` / `crossOrigin` hash

The platform publishes a deliberately mutable stable URL (`/widget.js`) and replaces it on every push to its `main`; a subresource-integrity hash would break on the vendor's next deploy, and the versioned `/v/<build-id>/` paths 404 as soon as a newer build publishes, so they cannot be pinned either. The trust boundary is therefore the vendor, which here is a first-party Codezen deployment. This is a real trade-off, recorded below.

### 5. Tests split by what they can actually see

- **Vitest** covers the gate and the tag's shape: unset → no script; set → one script with that `src`, and no visitor data among its attributes. jsdom cannot execute the remote bundle, so it asserts nothing about the widget itself.
- **Playwright** covers the widget genuinely mounting: with the var set, `[data-live-chat-widget]` appears on a public page. It must `test.skip` when the var is absent — but _loudly_, following the pattern the existing config comment describes, so a skip is not read as a pass.

_Alternative — assert on the launcher's accessible name:_ couples this repo's test to the vendor's copy. The host element's data attribute is the stable contract.

## Risks / Trade-offs

- **Third-party script runs on authenticated pages, including dashboards and checkout** → Accepted deliberately: it is a first-party Codezen deployment, and the bundle isolates itself in a Shadow DOM. Mitigation is organisational (the vendor is us) plus the no-PII requirement, which means a compromise of the bundle gains no session data from this app's own hand.
- **No SRI on a mutable URL** → Cannot be mitigated without the platform publishing pinnable versioned bundles. If a CSP is added to `next.config.mjs` later, `script-src` must list `chat-widget.easychat.org.uk` and `connect-src` the chat API and gateway origins — worth a comment at the mount site so the next person adding a CSP finds it.
- **Preview deploys land chats in the real inbox if someone sets the var there** → Mitigated by empty-default plus the brand-attribution behaviour: an unregistered preview hostname produces an untagged chat, which is visible as such to agents.
- **Widget covers a page's own fixed UI (cookie banner, sticky checkout bar) in a bottom corner** → Not addressed here; the widget's placement is configurable in the chat admin, so a collision is fixed there rather than with CSS in this repo. Flag it during the verification task instead of pre-emptively styling around it.
- **An ad blocker suppresses the script** → Page is unaffected by construction; nothing in this app depends on the widget having loaded.

## Migration Plan

1. Register a brand in the chat admin whose `domain` is the production hostname of this site (hostname only). Without it, chats arrive untagged — not broken, but unattributed.
2. Ship the code with the variable unset everywhere. Nothing changes for any visitor.
3. Set `NEXT_PUBLIC_LIVE_CHAT_WIDGET_URL` in production, redeploy, and verify against the running site: launcher appears, a test chat reaches the agent inbox tagged with the right brand.
4. Rollback is unsetting the variable and redeploying — no code revert, no data to unwind.
