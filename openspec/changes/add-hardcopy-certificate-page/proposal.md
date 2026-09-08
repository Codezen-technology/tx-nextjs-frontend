## Why

The live WordPress site serves a second, distinct certificate ordering page at
`/hardcopy-certificate/` ("Order Hardcopy Certificate", Gravity Form **22**) alongside
`/certificate/` (Gravity Form **23**). It is a hardcopy-led funnel: the printed
certificate is the required primary purchase and the digital transcript is an optional
£9.99 add-on, which is the inverse of `/certificate`'s digital-led ordering.

The headless frontend has no such page. Worse, `next.config.mjs` currently **301-redirects
`/hardcopy-certificate` → `/certificate`**, so every existing inbound link, ad landing, and
indexed URL for the hardcopy funnel silently lands on the wrong offer with the wrong
required field. Migrating this page closes that gap and removes an actively wrong redirect.

## What Changes

- Add the public route `/[locale]/(shop)/hardcopy-certificate` under `MinimalShell`, mirroring
  the `/certificate` page shell (hero + order card + promo sidebar).
- **BREAKING (routing):** remove the `"/hardcopy-certificate": "/certificate"` 301 from
  `next.config.mjs` so the slug resolves to the new page instead of redirecting.
- Generalise the certificate order form from a single hardcoded Gravity Form to a
  **product-addressed** one. `CertificateForm` gains a `product` prop
  (`"default" | "hardcopy"` — the plugin's product slug); it no longer assumes form 23.
- Add product-aware BFF routes so hardcopy config/quote/intent/confirm price and record
  against form 22 instead of form 23, with the same server-authoritative pricing rule
  (client-sent prices are never trusted).
- Fetch editable page content for the hardcopy hero/order/promo from the CMS with the
  same per-field static-fallback behaviour `/certificate` already has.
- Add SEO: `generateMetadata` via `fetchRankMathSeo(wpPath.page("hardcopy-certificate"))`
  plus static fallbacks and a canonical.
- **Backend contract doc:** the plugin implements product-scoped ordering in its own
  `add-hardcopy-certificate-api` change (not yet merged or deployed). This change ships
  `docs/HARDCOPY_CERTIFICATE_API.md` recording what the frontend depends on plus the three
  gaps that change does not cover: a `{product}`-scoped `page` route, `shipping.appliesTo`,
  and the `hardcopy` record form. The plugin work is out of scope for this repo — the
  frontend degrades safely until it lands.

## Capabilities

### New Capabilities

- `hardcopy-certificate-page`: the `/hardcopy-certificate` route — its content sourcing and
  fallbacks, hardcopy-led ordering semantics (hardcopy required, digital transcript
  optional), product-scoped pricing/recording, SEO, and the removal of the legacy 301.

### Modified Capabilities

- `certificate-page-content`: the "Certificate order form is unaffected" requirement asserts
  `CertificateForm` sources data _exclusively_ from the unparameterised `GET /certificate/config`.
  That becomes product-addressed. The requirement is restated so `/certificate` keeps its exact
  current behaviour as the `default` product, and so the shared form component is explicitly
  allowed to be product-driven.

## Impact

**Frontend code**

- `src/app/[locale]/(shop)/hardcopy-certificate/{page,layout}.tsx` — new
- `src/components/certificate/certificate-form.tsx` — accepts `product`, drops the implicit form-23 assumption and the positional `products[1]` shipping rule
- `src/lib/services/certificate.ts` — `getPage`/`getConfig`/`getQuote`/`createIntent` take a product slug
- `src/types/certificate.ts` — `CertProductSlug` type and allowlist
- `src/app/api/certificate/{config,quote,intent,confirm,webhook}/route.ts` — map the slug onto the plugin's scoped paths
- `src/lib/api/endpoints.ts` — product-aware certificate endpoint builders
- `src/lib/utils/query-keys.ts` — certificate keys scoped by product (the form currently inlines `["certificate","config"]`, against repo convention)
- `src/lib/seo/app-routes.ts` — register the new route so it reaches the sitemap
- `next.config.mjs` — remove the `/hardcopy-certificate` redirect
- `src/lib/seo/wp-paths.ts` — reuse existing `wpPath.page`, no change expected

**Backend (separate repo, spec only)**

- `docs/HARDCOPY_CERTIFICATE_API.md` — new; what the frontend depends on, plus the three gaps
  in the plugin's `add-hardcopy-certificate-api` change
- `API_REFERENCE.md` — document the product-scoped certificate routes

**Risk**

- Payment path. Any slug plumbing error could price a hardcopy order against form 23.
  Pricing stays server-side; the slug is validated against an allowlist server-side and
  written into PaymentIntent metadata as `cert_product` — the key the plugin reads and
  treats as authoritative — so recording cannot drift from what was charged.
- The page must not go live before the plugin's `hardcopy` record form exists, or it will
  take payments it cannot record. See `docs/HARDCOPY_CERTIFICATE_API.md` §4 gap 3.
