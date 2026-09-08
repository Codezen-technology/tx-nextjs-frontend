## Context

See `proposal.md` — Why. Constraints that shape the approach:

- `src/lib/utils/url.ts` already owns origin rewriting (`WP_ORIGIN`, `SITE_ORIGIN`, `toFrontendPath`, `toFrontendUrl`, `replaceWpOrigin`, `isExternalUrl`) and documents the rule "apply at the service layer, never inline in components". Content HTML is the one case that rule cannot cover: the HTML is an opaque string until it is parsed, and the same string is rendered from both Server and Client Components.
- `src/components/ui/parsed-html.tsx` already parses WP HTML with `html-react-parser` and exposes a `replace()` hook, currently used only to camelCase lowercase WP attributes. That hook is the natural attachment point.
- Both origins come from `env` at module scope and may be empty or equal (local dev, CI, Playwright). The rewrite must be a no-op in those cases, not a crash.
- 13 sinks render CMS HTML directly with `dangerouslySetInnerHTML`; each has its own wrapper element and class set, so migrating them must not change the emitted DOM.

## Goals / Non-Goals

**Goals:**

- One enforcement point for the link rules, testable without rendering 13 components.
- Preserve the emitted DOM of every migrated sink — same tag, same classes, same nesting.
- Correct behaviour when the two origins are equal, empty, or invalid.

**Non-Goals:**

- Client-side navigation for in-content links. Rewriting to a root-relative `href` is the requirement; upgrading prose anchors to `next/link` is not (see Decisions).
- HTML sanitisation. This change does not add DOMPurify or alter what tags survive parsing — that is a separate security question with its own trade-offs.
- Rewriting URLs in non-content strings (SEO head, service permalinks, navigation). Those are already handled and are out of scope.
- Anything about the backend host itself — the TLS SAN gap on `www.cms.…` and the SiteGround captcha wall found during the audit are infrastructure items, not code.

## Decisions

### Rewrite at parse time in `ParsedHtml`, not at the service layer

The alternative is normalising content HTML inside each service (`blog.server.ts`, `products.ts`, `courses.ts`, `units.ts`, …). Rejected: content HTML reaches the renderer from at least six services plus BFF-proxied client responses, so the service layer gives N places to forget instead of one, and it would still miss any surface that renders a WP string not passed through a service. The parser already visits every element node; the marginal cost is a per-anchor check.

### Rewrite attributes, never the raw HTML string

`replaceWpOrigin(html)` over the whole string is one line and wrong: it rewrites `img src`, `srcset`, `<a href>` to uploaded PDFs, oEmbed iframes and any backend URL that happens to appear in prose text, producing frontend 404s for media the frontend does not serve. Decision: act only on `a[href]`, and act only after classifying the URL.

### Classification lives in `url.ts`, next to the origin constants

Add one predicate — "is this backend URL a content permalink, or a functional endpoint?" — beside `isWpBackendUrl`/`isExternalUrl`, so all origin knowledge stays in one module and is unit-testable without React. Functional = path under the WP content/plugin/upload directories, `wp-json`, `admin-ajax.php`, `wp-admin`, `wp-login.php`, or a WooCommerce transactional URL (add-to-cart / order-pay / order-received / order-key query). Everything else on the backend origin is content and gets `toFrontendPath`.

The list is a denylist over a small, stable surface. An unclassified functional URL degrades to a frontend 404 rather than a security problem, and the fix is one array entry.

### Root-relative `<a>`, not `next/link`

`toFrontendPath` returns a root-relative path, which is enough to satisfy the requirement and keeps `ParsedHtml` a plain parser usable from Server and Client Components alike. Upgrading to `next/link` was considered and rejected for now: a long article can carry dozens of in-content links, and each becomes a prefetch on viewport entry — a real cost for a link most readers never click. The footer nav's client-navigation requirement does not transfer, because a footer has ~20 curated links and a fixed viewport position.

### `ParsedHtml` gains an `as`/`className` pass-through per migrated sink

Each of the 13 sinks is migrated by replacing `<Tag className={…} dangerouslySetInnerHTML={{__html: x}} />` with `<ParsedHtml as="…" className={…} content={x} />`, choosing `as` to match the tag it replaced (default is `span`; most sinks need `div`). This is mechanical, but the DOM equality is what the migration must be checked against — the `prose-wp` styling depends on the wrapper element.

One behavioural difference is accepted deliberately: `ParsedHtml` runs `decodeEntities()` on the string first, so double-encoded entities that previously rendered as literal `&amp;` now render as `&`. That is a fix, not a regression, and matches every other WP string in the app.

## Risks / Trade-offs

- **A functional backend URL is misclassified as content** → it rewrites to a frontend path that 404s. Mitigated by the denylist covering the known WP/Woo endpoint shapes, and by unit tests per shape; the failure is visible and cheap to patch.
- **DOM drift while migrating 13 sinks** → prose styling breaks on a course tab or product description. Mitigated by choosing `as` per sink and by the existing design-fidelity E2E specs; migrate sinks in one commit per area so a regression bisects cleanly.
- **Parser cost on long articles** → an extra check per element node. Negligible next to the parse itself, and content pages are server-rendered and cached.
- **Content authored with protocol-relative or bare-host links** (`//cms.…/x`) → not matched by an origin comparison. Accepted: the URL parser resolves protocol-relative URLs when given a base, and the classifier will handle them; genuinely malformed markup is left untouched by design.
- **Editors keep authoring absolute backend links** → this change hides the symptom permanently, so nobody notices. Accepted, and preferable to the alternative; a WP-side fix (relative links in the editor) is not a prerequisite.

## Migration Plan

Pure render-path change: no data migration, no env change, no API change. The rewrite is inert wherever `NEXT_PUBLIC_WP_API_URL` and `NEXT_PUBLIC_SITE_URL` share an origin or either is unset, so local dev, CI and preview behave exactly as today. Rollback is a revert of the commit; no state is written.

Deploy order does not matter relative to the backend — the change reads no new backend field.
