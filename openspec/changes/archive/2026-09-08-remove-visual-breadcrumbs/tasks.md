## 1. Marketing surfaces

- [x] 1.1 Remove the `nav[aria-label="Breadcrumb"]` trail from the blog-single hero in
      `src/app/[locale]/(marketing)/blog/[slug]/page.tsx`, and drop the compensating
      `mt-8` from the sibling that followed it so the hero keeps its own rhythm
- [x] 1.2 Remove the breadcrumb trail from `src/components/courses/course-hero.tsx`,
      leaving the `course.breadcrumb` field itself untouched
- [x] 1.3 Remove the breadcrumb `nav` from `src/components/home/pricing-hero.tsx`, unwrap
      the fragment that now has a single child, and convert the JSX comment that sat
      beside it into a line comment above `return`
- [x] 1.4 Remove the breadcrumb placeholder row from the course-category loading skeleton
      at `src/app/[locale]/(marketing)/course-cat/[slug]/loading.tsx`

## 2. Shop surfaces

- [x] 2.1 Remove the breadcrumb `nav` from
      `src/app/[locale]/(shop)/product/[slug]/page.tsx`
- [x] 2.2 Remove the dark breadcrumb bar from `src/app/[locale]/(shop)/cart/page.tsx`
- [x] 2.3 Remove the dark breadcrumb bar from `src/app/[locale]/(shop)/checkout/page.tsx`

## 3. Cleanup

- [x] 3.1 Grep each edited file for `Link`, `ChevronRight` and `Home` and delete the
      imports the removal orphaned (`tsc` does not flag these)
- [x] 3.2 Run `pnpm format` so the reflowed JSX matches Prettier

## 4. Docs and spec hygiene

- [x] 4.1 Update `MIGRATION.md` — the blog-single hero no longer lists a breadcrumb, and
      `fetchCategories()` is described as feeding the hero pill and related cards
- [x] 4.2 Update `SEO_AUDIT.md` C1 so the `BreadcrumbList` recommendation no longer rests
      on those pages rendering a visual trail
- [x] 4.3 Record the ruling in `QA_REPORT_PLAN.md` §2.6, which had it open
- [x] 4.4 Reattach the `QA-PRICE-A1` inset note to the band it measures, rather than
      leaving it above `return` reading as a component-level comment
- [x] 4.5 Add delta specs folding the per-page breadcrumb rules into the site-wide
      capability: REMOVED on `single-course-page`, MODIFIED on `about-us-page-content`
- [x] 4.6 Archive the change so the deltas land in `openspec/specs/`

## 5. Verification

- [x] 5.1 Confirm the diff leaves every `BreadcrumbList` JSON-LD block untouched —
      `buildBreadcrumbSchema` in the course and course-category pages, the
      `CourseBreadcrumb` type, and the `breadcrumb` normalisation in
      `src/lib/services/courses.ts`
- [x] 5.2 Confirm no `<nav>` remains whose contents are an ancestor trail: the only
      surviving navs should be pagination, header/footer, sidebars and tab strips
- [x] 5.3 Run `pnpm typecheck` (clean) and `pnpm lint` (0 errors)
- [x] 5.4 Run `pnpm test` and confirm the suite passes with no breadcrumb-related failures
