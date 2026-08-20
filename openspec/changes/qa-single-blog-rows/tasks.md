## 1. Record the measurements

- [x] 1.1 Append a "Single Blog page" section to `.context/figma/targets.md`: container geometry, hero image, in-article heading token, body token, 1280 padding — each with its source node
- [x] 1.2 Record the `A6` contradiction in full — report 32px bold, frame `Heading/Bold/H5` 20px SUSE Bold, build 24px/600 Open Sans — and why the frame wins
- [x] 1.3 Record the seven `A7` FAQ deltas from `6015:127392` so the next slice can apply them without re-reading the frame

## 2. Write the tests first

- [x] 2.1 Create `e2e/blog-single.spec.ts`, discovering a post **with a featured image** at runtime the way `course-detail.spec.ts` discovers a course
- [x] 2.2 `A4` — assert the featured image's source appears exactly once on the page, and that it is in the hero
- [x] 2.3 `A4` — assert content images inside the article still render
- [x] 2.4 `A6` — assert an article `h2` computes SUSE / 20px / 700 / 24px line-height
- [x] 2.5 `A6` — assert an article paragraph computes 16px / 400 / 24px
- [x] 2.6 `A6` — assert a legal page's prose headings are **unchanged**, so the scoping is real
- [x] 2.7 `A3` — assert the rendered category name equals the API's name for the post's first category
- [x] 2.8 `A8` — assert 128px side padding on the hero container and the header at 1280
- [x] 2.9 Run the file; `A4` and `A6` must fail, `A3` and `A8` must pass — that split is the evidence the two closures are real and the two fixes are needed

## 3. Apply

- [x] 3.1 `A4` — remove the article-top featured-image block from `blog/[slug]/page.tsx`, keeping the hero's and leaving `contentWithIds` alone
- [x] 3.2 `A6` — add a `prose-wp-article` modifier to `globals.css` holding only the heading rules: SUSE, 20px, 700, 1.2, `--color-neutral-900`
- [x] 3.3 `A6` — apply the modifier to the blog article's `ParsedHtml` alongside `prose-wp`
- [x] 3.4 Confirm no other surface picks up the modifier

## 4. Verify

- [x] 4.1 Re-run `e2e/blog-single.spec.ts` at `chromium`, `desktop-1920`, `mobile-440`
- [x] 4.2 Mutation-check the `A6` assertion: revert the heading size, confirm the failure names family/size/weight, restore
- [x] 4.3 Full `--project=chromium` run — **at `--workers=2`**. The default parallelism reported twelve failures, six of which passed alone and again at two workers: the dev server cannot compile routes fast enough for four workers. Recorded in `QA_EXECUTION.md`
- [x] 4.4 `pnpm typecheck && pnpm lint && pnpm test`

## 5. Flip statuses and commit

- [x] 5.1 `A4` and `A6` → `FIXED` with their test references
- [x] 5.2 `A3` → `CANT-REPRODUCE`, `A5` → `CANT-REPRODUCE`, `A8` → `FIXED` (verify-and-close), each with the measurement in `Manual`
- [x] 5.3 `A7` — keep `STILL-BROKEN`, replace its `Manual` with the seven measured deltas and the reason it is not fixed here
- [x] 5.4 Recompute the Single Blog index row (`Open` 7 → 2) and its `Ready` value
- [x] 5.5 Update Appendix B — `A3`, `A6` and `A8` leave the backlog; nothing new joins
- [x] 5.6 `pnpm test` — doc checker green on all six assertions
- [x] 5.7 Commit as `fix(qa-single-blog): close five of seven rows`
