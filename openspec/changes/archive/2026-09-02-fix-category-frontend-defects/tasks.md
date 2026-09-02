## 1. "Why Choose Us" image at every width

- [x] 1.1 In `src/components/courses/category-why-choose-us.tsx`, replace the image
      wrapper's `hidden … lg:block` gate with a width-spanning aspect box:
      `relative w-full overflow-hidden rounded-2xl aspect-[16/9] lg:aspect-auto
lg:h-[312px] lg:w-[526px] lg:shrink-0`. Leave the `fill` image and the
      gradient fallback branch untouched.
- [x] 1.2 Confirm source order still puts the image after the reason list, so
      `lg:flex-row` keeps the desktop arrangement without a second DOM copy.
- [x] 1.3 Unit test in `src/__tests__/` — with an image supplied, the `img` is in the
      document and its wrapper carries no `hidden` class; with the image null, the
      gradient fallback renders and no `img` element exists.

## 2. Trusted-organisations band on the category page

- [x] 2.1 In `src/app/[locale]/(marketing)/course-cat/[slug]/page.tsx`, add
      `serverApi.home.get()` to the existing `Promise.allSettled` batch and read it as
      `home = homeResult.status === "fulfilled" ? homeResult.value : null`.
- [x] 2.2 Render `<TrustedOrgs data={home?.trusted_orgs} />` after
      `<CategoryWhyChooseUs />`, outside the section's `bg-white` wrapper, so the
      band keeps its own background and `grid-inset-start` bleed.
- [x] 2.3 Verify the band is omitted (not empty) when `home` is null — `TrustedOrgs`
      already returns `null` for an empty list; assert it rather than assume it.

## 3. Verification

- [x] 3.1 `pnpm typecheck`, `pnpm lint`, `pnpm test` — all clean.
- [x] 3.2 Extend the category E2E coverage: at 440 and 1280, with a stubbed category
      image, assert the "Why Choose Us" image has `naturalWidth > 0` and a non-zero
      box; assert the trusted-organisations band renders between "Why Choose Us" and
      the team CTA.
- [x] 3.3 Screenshot `/course-cat/animal-care-training` at 1920, 1280 and 440 and
      compare against Figma `3294:42427`; check the band's position and the mobile
      image box against `.context/qa-validate/` baselines.
- [x] 3.4 Confirm `/` and `/pricing` still render their trusted-organisations band
      unchanged — the shared component and its payload were not modified.

## 4. Close-out

- [x] 4.1 Update the QA tracker: Category / Mobile-440 / Issue 8 → fixed. Record that
      Issue 2 (FAQ) and Issue 4 (image source) remain open as backend content gaps —
      `GET /course-categories` returns `faq: null` and `why_choose_us: null` for all
      20 categories — so the category page is not yet fully closed.
