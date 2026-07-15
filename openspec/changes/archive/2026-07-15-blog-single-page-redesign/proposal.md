## Why

The single blog post page (`src/app/[locale]/(marketing)/blog/[slug]/page.tsx`) still uses a placeholder two-column layout carried over from the WP migration. Figma has a finished, high-fidelity design for this page (node `4146:88473`, "Blog Single Page Responsive") with a redesigned hero, a three-column reading layout (TOC + share/promo card), richer prose styling for tables/lists/FAQ content, and dedicated "Related Courses" + "More Blogs" sections. Shipping this closes the gap between the live WP theme's polish and the headless frontend, and gives editors reason to trust the new content types (tables, FAQ blocks) render well.

## What Changes

- Rebuild the hero section: full-bleed dark navy/teal gradient band, headline + supporting text + category/date meta on the left, framed featured image on the right (replaces the current plain hero).
- Restyle `BlogPostSidebar`'s Table of Contents card to match the new spacing/typography/active-item treatment (amber left-border + tint on the active section).
- Add a new sticky right-rail "share/helpful" card (headline, "Copy link" button, social icon row) plus a promo/ad slot above it.
- Change the article layout from 2-column to 3-column on desktop (TOC | article | share card), collapsing to a single column with TOC/share content relocated on mobile.
- Extend prose styling (`ParsedHtml` / article CSS) to cover the new content shapes used in the design: bordered data tables, bulleted feature lists with custom dot markers, and an FAQ accordion block.
- Add a "Related Courses" section (4-up `CourseCard` grid) between the article and the existing "More Blogs" section; expand "More Blogs" from 3 to 4 cards to match the design.
- Add an FAQ accordion block to the article, reusing the existing `CourseFaq` interaction pattern (local open/close state, plus/minus icons) generalized for blog use.

No changes needed to the bottom-of-page newsletter CTA band ("Training That Works for Your Team") or to design tokens — both already exist and already match the Figma design (see design.md).

## Capabilities

### New Capabilities

- `blog-single-page`: layout, content rendering, and section composition of the single blog post route (`/blog/[slug]`), covering hero, sidebar/TOC, share card, article prose (tables/lists/FAQ), related courses, and related posts.

### Modified Capabilities

- none (no existing spec covers this route today; `homepage-sections` and `course-card-promotions` are unrelated pages/components, though `course-card-promotions` may be reused as-is for the Related Courses grid).

## Impact

- **Route**: `src/app/[locale]/(marketing)/blog/[slug]/page.tsx` — restructure section layout (hero, 3-column article layout, Related Courses section, Related Blogs count 3→4).
- **Components changed**: `src/components/blog/blog-post-sidebar.tsx` (sticky TOC restyle + teal/amber active-item accent, split "share/helpful" card out into its own component), `src/components/ui/parsed-html.tsx` (prose CSS for bordered tables and dot-marker lists).
- **New components**: `src/components/blog/blog-share-card.tsx` (copy-link + social icons), an FAQ block for the article (reusing `CourseFaq`'s interaction pattern from `src/components/courses/course-faq.tsx`).
- **Reused as-is, no changes**: `src/components/home/blog-card.tsx` (More Blogs grid), `src/components/courses/course-card.tsx` (Related Courses grid), the newsletter/CTA band already in `src/components/layout/footer.tsx:170-197` (renders on this page today via the marketing layout).
- **Data**: Related Courses needs a course-fetch call (existing courses service/hooks); FAQ/table content is expected to arrive as normal WP post HTML through `ParsedHtml` — to be confirmed in design.md.
- **Styling**: none — all required fonts/colors (`font-suse`, `font-open-sans`, `neutral-*`, `primary-*`, `secondary-*`) already exist in `src/app/globals.css` `@theme` and match the Figma tokens 1:1.
- **No BREAKING changes** to public URLs, data contracts, or SEO metadata generation.
