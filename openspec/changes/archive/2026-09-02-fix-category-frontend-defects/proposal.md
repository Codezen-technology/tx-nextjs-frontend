## Why

Validation of `/course-cat/[slug]` against the QA report and both candidate Figma
frames (`3294:42427` and `6015:108699`, which agree on every point below) found two
defects the frontend owns outright:

1. The "Why Choose Us" image is wrapped in `hidden … lg:block`, so it never renders
   below 1024px. QA row **Category / Mobile-440 / Issue 8** asks for exactly this
   image and is still open — and it would stay open even after the backend supplies
   the image, because the class hides it regardless of data.
2. The "Trusted by Over 50,000 Organizations Worldwide" logo band sits between
   "Why Choose Us" and the team CTA in both design frames and is absent from the
   built page. The Homepage and Pricing pages already render this band from
   `GET /home` — the category page simply never adopted it.

The other two open category rows (FAQ section, "Why Choose Us" image _source_) are
content gaps: `GET /course-categories` returns `faq: null` and `why_choose_us: null`
for all 20 categories, so no frontend change can close them. They are out of scope
here and stay on the backend's plate.

## What Changes

- The "Why Choose Us" image renders at every width, not only at `lg` and above.
  Its aspect and placement follow the mobile design: full-column beneath the reason
  list at small widths, beside the list from `lg` up.
- The category page renders the trusted-organisations logo band between the
  "Why Choose Us" section and the site's team CTA, reading the same
  `home.trusted_orgs` payload the Homepage and Pricing pages already read.
- The band degrades to nothing when the payload is empty or the request fails, so a
  backend outage cannot leave an empty beige stripe on the page.
- No change to the shared trusted **strip** beneath the header. Its copy differs from
  the design frames, but that divergence is site-wide, was never raised in the QA
  report, and is tracked separately.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `course-category-page`: adds two presentation requirements — the "Why Choose Us"
  image is visible at every width, and the page carries the trusted-organisations
  band between "Why Choose Us" and the team CTA.

## Impact

- `src/components/courses/category-why-choose-us.tsx` — image wrapper loses its
  `hidden lg:block` gate and gains a mobile size.
- `src/app/[locale]/(marketing)/course-cat/[slug]/page.tsx` — fetches
  `serverApi.home.get()` alongside its existing `Promise.allSettled` batch and renders
  `<TrustedOrgs />`.
- `src/components/home/trusted-orgs.tsx` — read-only reuse; already returns `null` on
  an empty list and is already used off the homepage by `/pricing`.
- No API, type or endpoint changes. No backend dependency: `GET /home` is already
  consumed by two shipped pages.
- Tests: unit coverage for the "Why Choose Us" section at both widths, and an E2E
  assertion at 440 and 1280 that the image occupies a non-zero box.
