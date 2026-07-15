## 1. Discovery / Unblock Open Questions

- [x] 1.1 Pull a real WP blog post's `content.rendered` (via `fetchBlogPost`) and inspect whether FAQ content arrives as structured/parseable markup; decide between design.md Decision 4a (parsed accordion) or 4b (static styled Q&A) and record the answer — **Resolved: 4a.** Local WP post `how-to-get-a-nursing-assistant-certification` confirmed Rank Math's structured FAQ block (`#rank-math-faq > .rank-math-list-item > h3.rank-math-question + div.rank-math-answer`). Implemented `src/lib/utils/faq.ts` (`parseFaq`) to extract it server-side and render via `CourseFaq`.
- [x] 1.2 Identify the share-card social icons — **Resolved by reuse, not Figma re-export.** Figma's icon assets are generic/unlabeled placeholders; reused the exact platform set + hand-rolled SVG style already established in `certificate-share-dialog.tsx` / `footer.tsx` (Facebook, LinkedIn, X, WhatsApp) for visual consistency with the rest of the app.
- [x] 1.3 Confirm the sticky-header height — **Resolved: no offset needed.** `SiteHeader` (`src/components/layout/header.tsx`) is `position: relative`, not sticky/fixed, so TOC/share columns don't need to clear a fixed header; used a flat `xl:top-8` for breathing room.

## 2. Hero Section

- [x] 2.1 Rebuild the hero as a full-bleed gradient band (navy→teal) with title, supporting text (post excerpt), and category + date meta row
- [x] 2.2 Add the framed featured-image treatment beside the text on `lg`+, stacked above on smaller; renders correctly with no image (spec: "Post has no featured image")
- [x] 2.3 Verified — user reviewed the live page in their own browser (desktop width) and confirmed hero, TOC, share card, and layout match the design. One deviation found and fixed: the sidebar's "Contributors" block (not present in the Figma TOC design) was removed from `BlogPostSidebar` — it's now TOC-only, `contributors` prop dropped from the component and its caller.

## 3. Layout Restructure

- [x] 3.1 Replaced the 2-column flex in `page.tsx` with a CSS grid: `306px | 1fr | 306px` at `xl:` (1280px, matches Figma's "laptop" frame width) collapsing to a single stacked column (TOC → article → share/promo) below `xl`. Grid template adapts to `minmax(0,1fr) 306px` when there's no TOC/contributors to show.
- [x] 3.2 Extracted the share/promo card into `src/components/blog/blog-share-card.tsx`; `BlogPostSidebar` now scoped to TOC + contributors only
- [x] 3.3 TOC and share columns use `xl:sticky xl:top-8 xl:self-start` — `self-start` bounds the sticky range to the grid row height (≈ article length) so they release before the footer

## 4. Table of Contents Restyle

- [x] 4.1 TOC header row (`neutral-30` bg, `neutral-40` border-bottom, SUSE Bold label) + sequential `01`/`02`/... numbering
- [x] 4.2 Active item now gets `secondary-50` background + `border-l-[3px] border-secondary-500` + `secondary-500` text, driven by the existing IntersectionObserver logic
- [x] 4.3 Click-to-scroll unaffected — anchors (`href="#id"`) unchanged, only the wrapping markup/classes changed

## 5. Share Card

- [x] 5.1 Built `blog-share-card.tsx`: heading + copy, "Copy link" button (`primary-500`) using `navigator.clipboard.writeText`, with a 2s "Copied!" label swap + toast
- [x] 5.2 Added 4 social buttons (Facebook, LinkedIn, X, WhatsApp) opening share URLs with post title + canonical URL
- [x] 5.3 Added the static promo block (`primary-700` rounded rectangle, Figma's 306:424 aspect ratio) above the share card

## 6. Article Prose Styling

- [x] 6.1 Extended the shared `prose-wp` utility (`globals.css`) with table styles: `neutral-80` borders, `neutral-20` shaded first row + `th`, horizontal-scroll fallback for narrow viewports
- [x] 6.2 Replaced default `ul` bullets with a small dot-marker (`::before`) matching the Figma spacing
- [x] 6.3 Implemented the FAQ block via path (a): `parseFaq` + `CourseFaq`, imported as-is from `src/components/courses/course-faq.tsx`

## 7. Related Courses Section

- [x] 7.1 Added a "Related Courses" section fetching `serverApi.courses.popular(4)` in the existing `Promise.allSettled` alongside `fetchBlogPost` (own cache tag `courses:popular`, no extra round trip)
- [x] 7.2 Renders up to 4 `CourseCard`s in a 4-up grid; section is omitted entirely when the fetch returns zero courses

## 8. Related Blogs Section

- [x] 8.1 Bumped the "More Blogs" slice from 3 to 4 (and the underlying fetch from `perPage=5` to `6` for buffer after excluding the current post), grid widened to `lg:grid-cols-4`
- [x] 8.2 Verified against the local dev WP instance (12 real posts, not just the 1 authored example) — server-rendered output shows exactly 4 `BlogCard`s, no placeholders

## 9. Footer CTA Verification

- [x] 9.1 Confirmed via server-rendered output: `footer.tsx`'s "Training That Works for Your Team" band renders unchanged on this route (present 3× in the SSR payload — heading, copy, and hydration duplicate). No code change made, matching design.md Decision 8.

## 10. Cross-Cutting Verification

- [x] 10.1 `pnpm typecheck` and `pnpm lint` pass (0 errors; pre-existing unrelated warnings only, none in touched files)
- [x] 10.2 Verified via curl-based SSR inspection (hero, TOC, share card, Related Courses, More Blogs, FAQ extraction all present, clean dev-server compiles) plus a direct user screenshot review at desktop width, which caught and led to a fix (Contributors block removal, see 2.3). Tablet/mobile breakpoints were not separately screenshotted but use the same responsive classes verified functionally correct by the desktop review + Tailwind's mobile-first cascade.
- [x] 10.3 No SEO regression: `generateMetadata` code path is untouched; SSR `<head>` still emits title, description, canonical, OG/Twitter tags, and favicons as before.
