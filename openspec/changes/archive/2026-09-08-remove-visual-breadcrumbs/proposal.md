## Why

QA report item R-ABOUT-1920-02 — "there is breadcrumbs in the website — no need of
breadcrumbs" — was applied page-by-page (about-us, single course) rather than site-wide,
so seven surfaces still paint a breadcrumb trail. The bars are inconsistent in style
(dark bar on cart/checkout/pricing, inline text on blog/product/course hero) and add a
navigation affordance the design does not call for. Removing them everywhere settles the
report item once instead of one page at a time.

## What Changes

- Remove the visible breadcrumb navigation from every remaining surface that renders one:
  blog single, shop product single, cart, checkout, pricing hero, course hero, and the
  course-category loading skeleton.
- Keep all `BreadcrumbList` JSON-LD emitted by the single-course and course-category
  pages. Structured data is consumed by search engines, not by the layout, so it is
  unaffected by the visual removal — the precedent set by QA-COURSE-A2.
- Keep the `course.breadcrumb` domain field and its service normalisation: it is the
  source for the course page's `BreadcrumbList` schema.
- No **BREAKING** changes — no public API, route or data contract moves.

## Capabilities

### New Capabilities

- `site-breadcrumb-suppression`: the site-wide rule that no page renders a visible
  breadcrumb trail, while breadcrumb structured data is retained wherever a page already
  publishes it.

### Modified Capabilities

- `blog-single-article`: the "rendered category names the post's own category"
  requirement is stated in terms of the hero _and the breadcrumb_; with the breadcrumb
  gone the requirement narrows to the hero only.
- `single-course-page`: its per-page "no visual breadcrumb trail" requirement is removed,
  now that the same rule is stated once site-wide.
- `about-us-page-content`: its section-structure requirement restates the no-breadcrumb
  rule in prose; the prose now defers to the site-wide capability, while the page keeps
  its own verification scenario.

## Impact

Affected code:

- `src/app/[locale]/(marketing)/blog/[slug]/page.tsx`
- `src/app/[locale]/(marketing)/course-cat/[slug]/loading.tsx`
- `src/app/[locale]/(shop)/product/[slug]/page.tsx`
- `src/app/[locale]/(shop)/cart/page.tsx`
- `src/app/[locale]/(shop)/checkout/page.tsx`
- `src/components/home/pricing-hero.tsx`
- `src/components/courses/course-hero.tsx`

Affected docs — each documents the removed UI as current:

- `MIGRATION.md` (blog-single hero composition, `fetchCategories()` consumer list)
- `SEO_AUDIT.md` (C1 justifies breadcrumb JSON-LD by the visual trail's presence)
- `QA_REPORT_PLAN.md` (§2.6 records the site-wide ruling as still outstanding)

Unaffected: SEO metadata, JSON-LD builders (`buildBreadcrumbSchema` in the course and
course-category pages), `CourseBreadcrumb` type, `src/lib/services/courses.ts`
normalisation, and the existing e2e assertions that already forbid a breadcrumb bar on
`/about-us` and the single-course page.

Risk: pages that used the bar as their only top spacer can collapse visually; each
removal must leave the surrounding rhythm intact.
