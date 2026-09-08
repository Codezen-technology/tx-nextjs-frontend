## 1. Backend contract document

- [x] 1.1 Read the plugin's `add-hardcopy-certificate-api` change and align this change to its contract — product-scoped paths `/certificate/{product}/{config,quote,record}`, slugs `default`/`hardcopy`, unscoped routes as `default` aliases, 404 on unknown slug, `cert_product` in PI metadata
- [x] 1.2 Write `docs/HARDCOPY_CERTIFICATE_API.md`: what the frontend depends on, the form-22 vs form-23 field table from a real probe, and the three gaps the plugin change does not cover
- [x] 1.3 Record gap 1 (`/certificate/{product}/page` not registered), gap 2 (`shipping.appliesTo` not exposed), gap 3 (`hardcopy` record form does not exist — the page can take a payment it cannot record)
- [x] 1.4 Update `API_REFERENCE.md` §Certificates to document the product-scoped routes and link the gaps doc

## 2. Variant plumbing — types, endpoints, query keys

- [x] 2.1 Add `CertProductSlug = "default" | "hardcopy"` and the `CERT_PRODUCT_SLUGS` allowlist to `src/types/certificate.ts`; add the plugin's `products[].required` and `shipping.appliesTo` to the config types
- [x] 2.2 Convert `endpoints.certificate.{page,config,quote,record}` to product-taking builders emitting the plugin's unscoped alias for `default` and `/certificate/{product}/…` otherwise — never a query parameter
- [x] 2.3 Add `queryKeys.certificate.config(product)` and `.quote(product, selection)` to `src/lib/utils/query-keys.ts`
- [x] 2.4 Replace the inlined `["certificate", "config"]` key in `certificate-form.tsx` with the new constant — verify no other file inlines a certificate query key

## 3. Variant plumbing — service and BFF routes

- [x] 3.1 `certificateService.getPage(product)` — product-scoped Next.js cache tag (`certificate-page` / `certificate-page-hardcopy`), default `default`
- [x] 3.2 `certificateService.getConfig(product)` / `.getQuote(product, selection)` / `.createIntent({ product, … })` — all defaulting to `default`
- [x] 3.3 `/api/certificate/config` — read `product` from the query string, validate against `CERT_PRODUCT_SLUGS`, 400 on unknown, map onto the plugin's scoped path
- [x] 3.4 `/api/certificate/quote` — same validation on the body's `product`; put it in the upstream **path** and strip it from the forwarded body
- [x] 3.5 `/api/certificate/intent` — validate `product`, quote against its scoped path, and write `cert_product` into the PaymentIntent metadata
- [x] 3.6 `/api/certificate/confirm` — read `cert_product` off the **retrieved** PaymentIntent (never the request body) and POST to `/certificate/{product}/record`
- [x] 3.7 `/api/certificate/webhook` — same, from the signed event's PaymentIntent metadata
- [x] 3.8 Count the Stripe metadata keys a full form-22 order produces (address field 44 expands to several `input_44_*` inputs) and confirm it stays under 50 keys / 500 chars per value — measured 16

## 4. Refactor `/certificate` to the shared shell (no behaviour change)

- [x] 4.1 Capture a baseline: rendered HTML of `/certificate`'s order form (product groups, choice labels, prices, quantity options, shipping, field input names) before any edit
- [x] 4.2 Extract the hero + order card + promo sidebar from `src/app/[locale]/(shop)/certificate/page.tsx` into `src/components/certificate/certificate-page-shell.tsx`, parameterised by content, static defaults, and product slug
- [x] 4.3 Add a `product` prop to `CertificateForm` (default `"default"`), threading it through config/quote/intent; no per-product rendering branches
- [x] 4.4 Rewrite `/certificate/page.tsx` on top of the shell, keeping its existing `generateMetadata`, `revalidate = 3600`, and every static default string and image unchanged
- [x] 4.5 Diff against the 4.1 baseline — must be identical; run `pnpm typecheck`, `pnpm lint`, `pnpm test`
- [ ] 4.6 (needs live Stripe test keys + a browser — not runnable here) Place a live Stripe **test-mode** order on `/certificate` end-to-end and confirm the entry is recorded against form 23

## 5. Hardcopy page

- [x] 5.1 Add `src/app/[locale]/(shop)/hardcopy-certificate/layout.tsx` wrapping children in `MinimalShell`
- [x] 5.2 Add `src/app/[locale]/(shop)/hardcopy-certificate/page.tsx` rendering the shared shell with `product="hardcopy"`, `revalidate = 3600`, and the hardcopy static defaults: heading "Order Hardcopy Certificate", supporting line "Power Your Professional Growth with CPD Certification & Transcript", and the three benefit bullets
- [x] 5.3 Add `generateMetadata` using `fetchRankMathSeo(wpPath.page("hardcopy-certificate"))` + `buildPageMetadata` with fallback title, ≤160-char description, and canonical `${env.SITE_URL}/hardcopy-certificate`
- [x] 5.4 Fail closed by construction: the scoped path 404s on a plugin build without the hardcopy product, which renders the order area's unavailable state instead of a wrong-priced form (no response echo needed)
- [x] 5.5 Verify hardcopy ordering semantics render correctly from form 22's schema — hardcopy group (69) first and required (never pre-selected), digital transcript (51) second with its opt-out, shipping gated on the hardcopy group not on array position, address inputs named `input_44_*`
- [x] 5.6 Add hardcopy hero images (`tx-certificate-new.png`, `tx-transcript-new.png` equivalents) under `public/images/certificate/` as the static fallback, or reuse the existing certificate/transcript mockups if visually equivalent

## 6. Redirect removal

- [x] 6.1 Remove the `"/hardcopy-certificate": "/certificate"` entry from `next.config.mjs`, leaving `"/thank-you-for-ordering-certificate"` and all other legacy 301s intact
- [x] 6.2 Confirm `/hardcopy-certificate` returns 200 (not 301) and `/thank-you-for-ordering-certificate` still 301s to `/certificate`

## 7. Tests

- [x] 7.1 Unit: endpoint builders emit the unscoped alias for `default`, `/certificate/hardcopy/…` otherwise, and never a query parameter
- [x] 7.2 Unit: BFF route product validation — unknown slug returns 400 and does not reach WP; omitted slug resolves to the unscoped alias; the slug moves from body to path
- [x] 7.3 Unit: intent writes `cert_product` to PaymentIntent metadata and quotes against the scoped path; confirm and webhook read it from the retrieved PI, address the scoped record path, and ignore a conflicting body value
- [x] 7.4 Component: hardcopy page renders form-22 config — hardcopy group first, digital opt-out present, prices from the mock
- [x] 7.5 Component: hardcopy page renders the unavailable state when the config request fails (the 404 case), and never the other product's groups
- [x] 7.6 Component: per-field content fallback, total content-fetch failure, and content naming another product all render the hardcopy static defaults
- [x] 7.7 E2E (Playwright): `/hardcopy-certificate` loads unauthenticated with hero + order area, and submitting without a hardcopy selection is blocked

## 8. Verification

- [x] 8.1 `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [x] 8.2 Visual comparison of `/hardcopy-certificate` against `https://cms.trainingexcellence.org.uk/hardcopy-certificate/` for hero copy, product ordering, choice labels, and prices
- [x] 8.3 Re-run the `/certificate` order form baseline diff from 4.1 after all work — still identical
- [x] 8.4 Confirm `/hardcopy-certificate` metadata canonical points at the frontend domain, not `cms.trainingexcellence.org.uk`
- [x] 8.5 Register `/hardcopy-certificate` in `src/lib/seo/app-routes.ts` (the route-registry test fails otherwise) and confirm it is marked indexable with a sitemap priority
- [x] 8.6 Probe the deployed plugin to confirm the fail-closed path is real: `/certificate/config` → form 23, `/certificate/hardcopy/config` → 404
- [x] 8.7 Deploy the plugin branch's three PHP files to `tx-local-site.test` and verify the live contract: hardcopy config → form 22 with group 69 first + `required: true`, quote → £22.98, unknown slug → 404, `/certificate` unchanged
- [x] 8.8 Drive `/hardcopy-certificate` in a browser against the real backend — hardcopy group unselected, shipping appears only after a hardcopy choice, Pay button reads £22.98, zero console errors
- [x] 8.9 Rebuild `src/__tests__/fixtures/certificate-config.ts` from the real captured responses (both products) so the fixtures stop being reconstructions
- [x] 8.10 Gate the quote query on required groups being satisfied — it was firing a known-invalid request on mount and on every keystroke, which the backend correctly 400s
