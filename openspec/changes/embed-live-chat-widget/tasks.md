## 1. Configuration

- [x] 1.1 Add `LIVE_CHAT_WIDGET_URL: process.env.NEXT_PUBLIC_LIVE_CHAT_WIDGET_URL ?? ""` to `src/lib/env.ts`, in the external-origins group near `CDN_URL`, with a comment stating that empty means chat is off and why that is the default.
- [x] 1.2 Add `NEXT_PUBLIC_LIVE_CHAT_WIDGET_URL` to `.env.example` — commented out, with the production value `https://chat-widget.easychat.org.uk/widget.js` and a note that unset disables the widget entirely.
- [x] 1.3 Add the variable to the optional-overrides list in `CLAUDE.md`'s Environment section, with the one operational prerequisite that lives outside this repo: a brand row in the chat admin whose `domain` is this site's hostname (hostname only — no scheme, no port), or chats arrive untagged.

## 2. Mount

- [x] 2.1 Create `src/components/live-chat/live-chat-widget.tsx`: a synchronous component that returns `null` when `env.LIVE_CHAT_WIDGET_URL` is empty, and otherwise a `next/script` element with that `src` and `strategy="afterInteractive"`. No `data-*` overrides, no visitor data.
- [x] 2.2 Comment at the mount site that a future CSP must list the widget origin in `script-src` and the chat API + gateway origins in `connect-src` — `next.config.mjs` sets none today, so this is the marker for whoever adds one.
- [x] 2.3 Render `<LiveChatWidget />` in `src/app/layout.tsx`, inside `<body>` after the providers, so it is present for every locale and route group.
- [x] 2.4 Run `pnpm typecheck` and `pnpm lint` clean.

## 3. Unit tests

- [x] 3.1 Add `src/__tests__/live-chat-widget.test.tsx`: with `NEXT_PUBLIC_LIVE_CHAT_WIDGET_URL` unset, the component renders no script tag (spec: "URL not configured").
- [x] 3.2 Same file: with the variable set, exactly one script tag with that `src` renders (spec: "URL configured").
- [x] 3.3 Same file: assert the rendered tag carries no attribute holding visitor or account data — only origin configuration (spec: "Script configuration carries no PII").
- [x] 3.4 Run `pnpm test` and confirm the new tests execute rather than skip.

## 4. End-to-end verification

- [x] 4.1 Add `e2e/live-chat.spec.ts`: with `NEXT_PUBLIC_LIVE_CHAT_WIDGET_URL` set, load the home page and assert `[data-live-chat-widget]` is attached (spec: "Public marketing page").
- [x] 4.2 Same spec: assert the same host element is present on an authenticated route and on a locale-prefixed URL (spec: "Authenticated area", "Non-default locale"), reusing the existing `e2e/helpers` auth helper.
      **Deviation:** `e2e/helpers` has only `cart.ts` — no auth helper — so the authenticated test logs in inline with `TEST_USER_EMAIL`/`TEST_USER_PASSWORD`, matching `auth-flow.spec.ts`, and skips loudly without them (it skipped in this run). The locale-prefixed URL cannot be visited at all: `src/i18n/routing.ts` declares one locale (`en`) with `localePrefix: "as-needed"`, so no prefixed URL exists. A second public route group (`/all-courses`) stands in, covering what the scenario guards — a mount above every route group.
- [x] 4.3 Make the spec `test.skip` loudly when the variable is absent — an annotated skip that names the missing variable, per the `playwright.config.ts` comment about silent skips reading as passes.
- [x] 4.4 Run `pnpm test:e2e` against a dev server with the variable pointed at a local widget bundle (`http://localhost:4321/widget.js`) or the production URL, and confirm the new spec passes rather than skips.

## 5. Manual verification before enabling production

- [x] 5.1 With the variable set locally, confirm the launcher appears, opens, and that a chat started from the widget reaches the agent inbox — and that the page still works with the script blocked (spec: "Script blocked or unreachable").
      Verified on `localhost:3000` against the production bundle: one `[data-live-chat-widget]` host, one script tag carrying only `src` + Next's own `data-nscript`, panel opens on click ("Chat with us", composer, "Powered by Easy Chat"). Script-blocked behaviour is covered by the e2e test, which passed on all three projects. **Not done:** no message was sent, so "reaches the agent inbox" is unproven — `localhost` is an unregistered hostname, so such a chat would land untagged anyway. Prove it as part of 5.3.
- [x] 5.2 Check the launcher does not cover the site's own fixed UI (cookie banner, sticky checkout bar, mobile nav); if it does, record it for a placement change in the chat admin rather than adding CSS here.
      **Partial:** desktop (1568px) checked on `/` and `/cart` — the bottom-right launcher clears the bottom-left dev badge and overlaps nothing. Narrow viewports were not checked visually; the mobile-440 e2e project asserts the widget _mounts_, not that it avoids overlap. Re-check on mobile before enabling production.
- [ ] 5.3 Register the production hostname as a brand in the chat admin, then set the variable in production, redeploy, and confirm a test chat arrives tagged with that brand.
