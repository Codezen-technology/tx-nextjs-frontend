## Why

Service-layer permalinks, footer navigation and SEO metadata already swap the WordPress backend origin for the frontend origin, but the HTML **body** WordPress returns does not. Every editor-inserted absolute link inside a blog post, product description, course tab, unit lesson or Gravity Forms HTML field renders verbatim — so a visitor who clicks an in-content link on `trainingexcellence.org.uk` lands on `cms.trainingexcellence.org.uk`, leaves the headless app, sees the old WordPress theme, and loses cart/session continuity. The same links hand crawlers a second, duplicate host for content the sitemap only ever declares on the frontend domain.

This is the last unhandled leak found in the pre-cutover audit of backend-origin URLs, and it has to close before the CMS domain is publicly reachable.

## What Changes

- WP-authored HTML content rewrites in-content anchor targets off the backend origin onto the frontend, preserving path, query and hash — the same rule the footer navigation and service layer already apply, extended to rendered content.
- Backend URLs that must keep hitting WordPress are explicitly excluded from the rewrite: media (`<img>`, `<source>`, `<video>`), uploaded file downloads under `/wp-content/`, WooCommerce cart/checkout/add-to-cart/order-pay endpoints, and `/wp-admin` / `/wp-login.php`.
- In-content links to genuinely third-party hosts stay untouched and open in a new tab with `rel="noopener noreferrer"`.
- Every CMS-authored HTML string renders through the single shared parser instead of ad-hoc `dangerouslySetInnerHTML`, so the rule has exactly one enforcement point. Affected sinks: product short/long description, the seven `course-*` tab components, the unit content display, quiz option text, and the two Gravity Forms HTML sinks.

## Capabilities

### New Capabilities

- `wp-content-link-rewriting`: how absolute URLs embedded in WordPress-authored HTML body content are rewritten, preserved, or externalised when rendered by the headless frontend.

### Modified Capabilities

<!-- None. Footer navigation and SEO metadata already specify their own origin
     rewriting and are unchanged by this work. -->

## Impact

- `src/components/ui/parsed-html.tsx` — gains the anchor rewriting rule in its `html-react-parser` `replace()` hook.
- `src/lib/utils/url.ts` — gains the predicate that decides whether a backend URL is content (rewrite) or functional (preserve).
- Raw HTML sinks migrated to `ParsedHtml`: `src/app/[locale]/(shop)/product/[slug]/page.tsx`, `src/components/courses/course-{about,why-take,requirements,assessment,what-you-learn,faq,experts}.tsx`, `src/components/player/unit-content-display.tsx`, `src/components/player/quiz-questions-panel.tsx`, `src/components/forms/gravity-form.tsx`, `src/components/gf-fields/html-field.tsx`.
- No API, dependency or environment change. Behaviour is driven by the existing `NEXT_PUBLIC_WP_API_URL` / `NEXT_PUBLIC_SITE_URL` pair, so it is inert when the two origins match.
