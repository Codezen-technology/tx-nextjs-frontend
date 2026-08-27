## 1. Housekeeping (design D5 — ships first, no rendering code)

- [x] 1.1 Add `test-results/` to `.gitignore` and `git rm -r --cached test-results/` so Playwright runs stop dirtying the working tree
- [x] 1.2 Archive `openspec/changes/fix-seo-metadata-defects` (41/43, merged into `main`, never archived) with `openspec archive`
- [x] 1.3 Delete `src/components/courses/course-info-card.tsx` — confirm zero importers with a repo-wide grep first; it carries a `/checkout?course=` CTA that would reintroduce the fixed Class B routing bug
- [x] 1.4 Run `pnpm typecheck && pnpm lint && pnpm test` to confirm the deletion broke nothing
- [ ] 1.5 **BLOCKED — needs the source QA Google Doc, not available locally.** Complete the verbatim 80-row grid in `.context/qa-tracker.md` from the source QA doc — one row per issue with QA-ID, quote, breakpoint, class, Figma node, target, status, evidence

## 2. Shared mechanism (design D1)

- [x] 2.1 Add an optional `fallback?: ReactNode` prop to `FallbackImage` for surfaces that want a placeholder component rather than a fallback URL; keep `fallbackSrc` working unchanged
- [x] 2.2 Confirm precedence is explicit and documented in the component: `src` → `fallbackSrc` → `fallback` node → nothing
- [x] 2.3 Add unit tests in `src/__tests__/fallback-image.test.tsx` covering all four spec scenarios: source loads, source fails with a fallback, source fails with no fallback, fallback also fails (must not retry in a loop)
- [x] 2.4 Verify the two existing consumers (`cpd-certificate.tsx`, `transform-team.tsx`) still behave identically

## 3. Triage pass — verdict before any fix (design D3, plan §3.3)

For each surface: read the CMS field from `GET /lms-backend/v1/*`, fetch the URL it
holds and record the HTTP status, then measure the rendered element's bounding box
and `naturalWidth` in a real browser. Record `component-bug` or `CONTENT-GAP` (or
both) in `.context/qa-tracker.md` with the measurement as evidence.

- [x] 3.1 About Us — image 1: record CMS field, URL status, rendered box, verdict
- [x] 3.2 About Us — image 2: same
- [x] 3.3 Category "Why Choose Us" — desktop: same. Note the component already uses `fill` in a sized parent, so a collapse is unlikely and a content gap is the working hypothesis
- [x] 3.4 Category "Why Choose Us" — mobile: same; establish whether this is the same underlying failure as 3.3 or a separate one (design Open Questions)
- [x] 3.5 Blog hero: `blog-hero.tsx` currently renders a CSS gradient and no `<img>` — establish what the QA note actually refers to before writing any fix. If it is not an image issue, reclassify it out of this change and record where it went
- [x] 3.6 Single Blog hero: same procedure
- [x] 3.7 Single Course: same procedure
- [x] 3.8 Write up every confirmed `CONTENT-GAP` as one itemised handoff list — CMS field path, stored value, HTTP status — for correction outside this repo

## 4. Per-surface fixes (design D2, one commit per page)

Only the surfaces that triage marked `component-bug`. Skip any marked
`CONTENT-GAP` only — those need no code beyond the graceful degradation from §2.

- [x] 4.1 About Us — route CMS images through `FallbackImage` with `AboutImagePlaceholder` as the `fallback` node; pin an explicit width or use `fill` in a sized parent
- [x] 4.2 **No code needed — CANT-REPRODUCE.** Category "Why Choose Us" — apply the verdict from 3.3/3.4
- [x] 4.3 **No code needed — RECLASSIFIED to Class D** (`blog-hero.tsx` is a CSS gradient, no `<img>`). Blog hero — apply the verdict from 3.5, or record the reclassification if it is not a Class C item
- [x] 4.4 **No code needed — CANT-REPRODUCE.** Single Blog hero — apply the verdict from 3.6
- [x] 4.5 **No code needed — CANT-REPRODUCE** (14 zero-box images all sit inside `hidden lg:*` wrappers). Single Course — apply the verdict from 3.7
- [x] 4.6 Confirm no fix introduces a layout shift: each image's reserved box must be present from first paint

## 5. Collapse-pattern sweep (design D2)

- [x] 5.1 Fix `src/components/home/accreditations.tsx` — `h-auto max-h-20 w-auto` is the same full 0×0 collapse as the certificate images; pin one axis
- [x] 5.2 Review the zero-_width_ variant on CMS-sourced logos — `trusted-orgs.tsx` (`h-14 w-auto`), `layout/footer.tsx` (`h-16 w-auto`), `blocks/block-renderer.tsx` (`h-12 w-auto`) — and add a width floor where the logo comes from the CMS
- [x] 5.3 Re-grep for any `next/image` with both `w-auto` and `h-auto` and confirm none remain
- [x] 5.4 Ship 5.1–5.2 as a separate commit from §4 — these are shared header/footer components on every page's critical path

## 6. Verification (design D4, spec `cms-image-resilience`)

- [x] 6.1 Extract a shared `assertImagesRender(page, locator)` helper in `e2e/qa-round-1.spec.ts` — scroll each image into view (they are lazy, so `naturalWidth` is 0 until then), then assert `complete`, `naturalWidth > 0`, and a non-zero bounding box
- [x] 6.2 Drive the covered surfaces from a table so adding one is a single row
- [x] 6.3 Add a row per resolved surface from §4, each skipping cleanly when the backend has no content for it
- [x] 6.4 Add an About Us row asserting the placeholder path, per the modified `about-us-page-content` spec
- [x] 6.5 Run the suite under all three viewport projects (`chromium`, `desktop-1920`, `mobile-440`) and confirm green
- [x] 6.6 Confirm the assertions fail as intended by temporarily breaking one image's sizing, then revert

## 7. Close-out

- [x] 7.1 Update `QA_REPORT_PROGRESS.md` — tick the Class C rows and the §7 housekeeping rows, update the done/total count
- [x] 7.2 Update `.context/qa-tracker.md` with each row's final status and evidence
- [x] 7.3 Run the full gate: `pnpm typecheck && pnpm lint && pnpm test` plus the E2E suite; compare failures against the known pre-existing baseline (`smoke:9`, `auth-flow:15`, `auth-flow:22`, `cancellations:11`, `cancellations:28`) and confirm no new ones
- [x] 7.4 Written to `PR_DESCRIPTION.md` in this change folder. State explicitly in the PR description which items remain out of round 1 and why: Class A (~27, blocked on the six Figma node pairs), Class D (8), Class E (7)
