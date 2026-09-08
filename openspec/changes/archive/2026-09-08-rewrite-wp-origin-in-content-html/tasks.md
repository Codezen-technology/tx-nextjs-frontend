## 1. URL classification in `src/lib/utils/url.ts`

- [x] 1.1 Add `isFunctionalWpUrl(url)` — true for backend-origin URLs under `/wp-content/`, `/wp-includes/`, `/wp-json/`, `/wp-admin`, `/wp-login.php`, `/wp-cron.php`, `admin-ajax.php`, and for WooCommerce transactional URLs (`?add-to-cart=`, `wc-ajax`, `/checkout/order-pay/`, `/checkout/order-received/`, or a `key=wc_order_*` query param). False for every other backend URL and for non-backend URLs.
- [x] 1.2 Add `rewriteContentHref(href)` — returns the original string for empty, relative, fragment-only, `mailto:`/`tel:`/other non-HTTP, external, and functional-backend inputs; returns `toFrontendPath(href)` for content URLs on the backend origin. No-op when `WP_ORIGIN` or `SITE_ORIGIN` is empty, or when the two are equal.
- [x] 1.3 Extend `src/__tests__/url.test.ts` with cases per spec scenario: backend permalink, relative/fragment/`mailto:`/`tel:`, equal origins, empty origins, uploads path, `wp-json`, `wp-admin`, add-to-cart, order-pay, order-received, bare `/cart` and `/checkout` (rewritten), third-party host.

## 2. Link rules in `src/components/ui/parsed-html.tsx`

- [x] 2.1 In the `replace()` hook, rewrite `a[href]` through `rewriteContentHref`, leaving all other attributes and all other elements untouched (`img`/`source`/`video`/`audio`/`iframe` src and srcset must not be touched).
- [x] 2.2 For anchors whose href is external per `isExternalUrl`, set `target="_blank"` and merge `noopener noreferrer` into any author-supplied `rel` without discarding existing tokens.
- [x] 2.3 Add `src/__tests__/parsed-html.test.tsx` rendering representative WP HTML: in-content backend link rewritten, backend `<img src>` preserved, uploads PDF link preserved, add-to-cart link preserved, external link gets `target`/`rel`, `rel="nofollow"` retained, `mailto:` untouched.

## 3. Migrate raw HTML sinks to `ParsedHtml`

- [x] 3.1 Course tabs — `course-about.tsx`, `course-why-take.tsx`, `course-requirements.tsx`, `course-assessment.tsx`, `course-what-you-learn.tsx`, `course-faq.tsx` (answer), `course-experts.tsx` (bio): replace `dangerouslySetInnerHTML` with `<ParsedHtml as="div" className={…} content={…} />`, preserving the existing wrapper tag and classes exactly.
- [x] 3.2 Product page — `src/app/[locale]/(shop)/product/[slug]/page.tsx:159` (short description) and `:178` (description).
- [x] 3.3 Player — `src/components/player/unit-content-display.tsx:104` (`as="div"`) and `src/components/player/quiz-questions-panel.tsx:122` (option text, `as="span"`).
- [x] 3.4 Gravity Forms — `src/components/forms/gravity-form.tsx:356` (confirmation) and `:587`, plus `src/components/gf-fields/html-field.tsx:8`.
- [x] 3.5 Verify no CMS-authored `dangerouslySetInnerHTML` remains: `grep -rn "dangerouslySetInnerHTML" src/` returns only JSON-LD script sinks.

## 4. Verify

- [x] 4.1 `pnpm typecheck && pnpm lint && pnpm test` clean.
- [x] 4.2 Run the app against a backend on a different origin (`NEXT_PUBLIC_WP_API_URL` ≠ `NEXT_PUBLIC_SITE_URL`) and confirm on a blog article, a course detail page and a product page that in-content links resolve on the frontend origin while images still load from the backend.
- [x] 4.3 Confirm DOM parity for the migrated sinks — `prose-wp` styling on the blog article body and course tabs is unchanged (existing design-fidelity E2E specs pass).
