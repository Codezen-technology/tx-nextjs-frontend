## 1. Component: opt out of the header CTA

- [x] 1.1 Add `showHeaderCta?: boolean` to `PricingSectionProps` in
      `src/components/home/pricing-section.tsx`, defaulting to `true` in the destructure so
      the homepage's call site is unchanged.
- [x] 1.2 Add the flag as a conjunct to the existing header-link condition
      (`header.ctaHref && header.ctaLabel`). Leave the link markup as it is.
- [x] 1.3 Comment the prop with why it exists — the link targets `/pricing`, so on that page
      it points at itself — mirroring the note already on `CategoriesGrid`'s `showViewAll`.

## 2. Page: source the section from the home payload

- [x] 2.1 In `src/app/[locale]/(marketing)/pricing/page.tsx`, change
      `<PricingSection data={pricing?.pricing} />` to
      `<PricingSection data={home?.pricing} showHeaderCta={false} />`.
- [x] 2.2 Comment the call site: the homepage payload is the maintained one (it carries
      `product`, so the CTAs add to cart), and `/pricing` already fetches `home`, so this
      adds no request.
- [x] 2.3 Leave `serverApi.pricing.get()` in the `Promise.all` — `pricing?.faq` still uses it.
      Confirm nothing else on the page reads `pricing.pricing`.
- [x] 2.4 Annotate `PricingPageData.pricing` in `src/types/home.ts` as returned-but-unread,
      pointing at this change, so the old wiring is not "restored" later.

## 3. Tests

- [x] 3.1 Unit test `PricingSection`: with `showHeaderCta` unset the header link renders;
      with `showHeaderCta={false}` it does not, while the heading and description still do.
      Add alongside `src/__tests__/quantity-selector.test.tsx`.
- [x] 3.2 Unit test that a plan carrying `product` renders a cart-wired CTA and one without
      falls through to navigation — pinning the behaviour the proposal identifies as the
      damaging difference, so a future data regression fails a test rather than the page.
- [x] 3.3 Extend `e2e/pricing.spec.ts` with a parity check: scrape the plan cards from `/`
      and from `/pricing` (name, price, was-price, badge, CTA label, feature labels) and
      assert the two lists are equal. This is the spec's first scenario and the change's
      whole point — it must fail against `main`.
- [x] 3.4 Extend the same spec: `/pricing`'s pricing heading row contains no
      "View more details" link, and the homepage's still does.

## 4. Verify

- [x] 4.1 Run `pnpm typecheck` and `pnpm lint`.
- [x] 4.2 Run `pnpm test`.
- [x] 4.3 Run `pnpm test:e2e -- pricing` against a dev server and confirm 3.3 passes.
- [x] 4.4 Load `/` and `/pricing` side by side and confirm the sections match: same plans,
      same order, same prices, same badges, same CTA labels.
- [x] 4.5 On `/pricing`, click a plan's CTA and confirm it adds to the cart and lands on
      `/checkout` — the behaviour that was missing before, since those plans had no
      `product`.
- [x] 4.6 Confirm the homepage is unchanged: header link still present and pointing at
      `/pricing`, cards unchanged.
- [x] 4.7 Sanity-check the empty case — with no plans in the payload, neither page renders a
      stray heading.

## 6. Review follow-ups

- [x] 6.1 Register `QA-PRICE-B1`/`B2`/`B3` in `docs/qa/QA_BY_PAGE.md` with Ref `NONE`
      (precedent: `QA-CAT-A7`). The checker only walks doc→test, so unregistered IDs drift
      silently. Verify with `src/__tests__/qa-doc-check.test.ts`.
- [x] 6.2 Replace the Tailwind-utility selectors in the e2e scrape (`grid-cols`, `font-suse`,
      `line-through`, `button:not([aria-label])`) with `data-testid` / `data-plan-*` hooks
      added to `pricing-section.tsx`, `quantity-selector.tsx` and `pricing-cta.tsx`.
- [x] 6.3 Scrape the fields the spec enumerates but the first draft dropped — `subtitle`,
      `priceUnit`, `variant` — plus the section heading and description.
- [x] 6.4 Expose purchasability (`data-plan-purchasable`) and add `QA-PRICE-B3` driving a
      `/pricing` CTA to the cart and on to `/checkout`, so the spec's load-bearing scenario
      is covered by a committed test rather than a manual step.
- [x] 6.5 Fold the duplicated section-finding walk into one `scrapeSection`, with the header
      link included so `QA-PRICE-B2` reuses it.
- [x] 6.6 Extract `makePlan` / `monthlyProduct` / `makePricingSection` to
      `src/__tests__/fixtures/pricing-plans.ts` and point both test files at it. The
      `vi.mock` calls stay per-file — Vitest hoists them above imports.
- [x] 6.7 Fix the `page.tsx` comment: `home` is fetched _above_, and the single-source rule
      lives in the change delta, not yet in `openspec/specs/pricing-page-layout/spec.md`.

## 5. Follow-up (not this change)

- [x] 5.1 Note for the backend work stream: `lms-backend/v1/pricing` still returns a stale
      `pricing` block that no client now reads. Decide there whether to correct it or narrow
      the response to `{ faq }`. Do not block this change on it.
