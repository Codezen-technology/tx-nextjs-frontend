## Context

Current implementation: `src/app/[locale]/(marketing)/blog/[slug]/page.tsx` renders a plain hero, a 2-column layout (`BlogPostSidebar` with TOC + contributors, then an `article` with `ParsedHtml`), and a single "More from the blog" 3-card `BlogCard` grid before the shared footer. Data comes from `fetchBlogPost(slug)` (`src/lib/services/blog.server.ts:36-47`), which hits `wp/v2/posts?slug=...&_embed=wp:featuredmedia,author` and returns `BlogPost` (`src/types/blog.ts`).

Figma reference: file `VoTEBKr8x4fWlObjkr7RXg`, section "Blog Single Page Responsive" (`4146:88473`), containing 4 breakpoint frames — desktop (1920, container 1296 / 24px gutters), laptop (1280, container 1024), tablet, and mobile. Design tokens pulled from the relevant sub-nodes (hero `4040:12823`, TOC `4040:12419`, share card `4040:12669`, FAQ `4040:12639`, salary table `4040:12580`) all resolve 1:1 to tokens already defined in `src/app/globals.css` `@theme`:

| Figma token             | Hex                                     | Project token         |
| ----------------------- | --------------------------------------- | --------------------- |
| Neutral/N900            | #00204A                                 | `neutral-900`         |
| Neutral/N500            | #3B5374                                 | `neutral-500`         |
| Neutral/N80             | #94A1B3                                 | `neutral-80`          |
| Neutral/N30             | #EBEDF1                                 | `neutral-30`          |
| Neutral/N40             | #DEE2E7                                 | `neutral-40`          |
| Neutral/N20             | #F5F6F8                                 | `neutral-20`          |
| Neutral/N10             | #FAFBFB                                 | `neutral-10`          |
| Neutral/N0              | #FFFFFF                                 | `neutral-0` / `white` |
| Primary/primary-500     | #00BBF0                                 | `primary-500`         |
| Primary/primary-700     | #0085AA                                 | `primary-700`         |
| Secondary/secondary-500 | #9E6F21                                 | `secondary-500`       |
| Secondary/secondary-50  | #F5F1E9                                 | `secondary-50`        |
| Heading font            | SUSE (Bold/SemiBold)                    | `font-suse`           |
| Body font               | Open Sans (Regular/Light/SemiBold/Bold) | `font-open-sans`      |

No new tokens are required. `src/components/courses/course-faq.tsx` (`CourseFaq`) already implements the exact accordion interaction (local `useState` open index, plus/minus icon swap) the Figma FAQ block needs — it currently lives under `courses/` but its props (`{ heading?, items: { question, answer }[] }`) are already content-agnostic.

## Goals / Non-Goals

**Goals:**

- Match the Figma hero, 3-column article layout, TOC styling, share card, prose content styling (tables, dot lists, FAQ), Related Courses, and Related Blogs (4-up) sections, at all 4 breakpoints.
- Reuse existing components/tokens wherever the shape already matches (`CourseCard`, `BlogCard`, `CourseFaq`'s pattern, footer CTA band, all color/font tokens).
- Keep `ParsedHtml` as the single renderer for WP post body HTML; extend its prose CSS rather than parsing structured content out of the HTML.

**Non-Goals:**

- No changes to the WP data contract, `fetchBlogPost`, `BlogPost` type, or SEO/JSON-LD generation.
- No comment system, no author multi-byline, no reading-progress bar — not present in the Figma frame.
- No CMS/editor tooling changes for authors to produce FAQ/table content (out of scope; assumed to already arrive as standard WP table/list HTML — see Open Questions on FAQ).
- Not pulling the promo/ad block above the share card into a real ad system — ship it as a static placeholder card (matches Figma, which shows a plain teal rectangle with no bound content).

## Decisions

**1. Layout: 3-column CSS grid on desktop/laptop, stacked on tablet/mobile.**
Replace the current `sidebar | article` 2-column flex with a `grid-cols-[306px_1fr_306px]` (desktop) / `grid-cols-[238px_1fr]` + share card relocated below TOC (laptop) layout, matching the Figma frames. Below the `lg` breakpoint, TOC and the share card stack above/below the article body (Figma tablet/mobile frames show TOC first, then hero image, then body — no third column). Alternative considered: keep 2-column and float the share card inside the article column — rejected because Figma shows it as a genuinely sticky third rail independent of article scroll length.

**2. Share card is a new component, not bolted onto `BlogPostSidebar`.**
`BlogPostSidebar` currently owns "TOC + contributors." The Figma right rail (promo block + "Found this blog helpful? Share..." + copy-link button + 4 social icon buttons) is visually and functionally independent (different sticky column) and has no "contributors" content in the design. Splitting it into `blog-share-card.tsx` keeps `BlogPostSidebar` focused on TOC and lets each column scroll/stick independently. Copy-link behavior mirrors the `navigator.clipboard.writeText` pattern already used in `certificate-share-dialog.tsx:196`; social icons link out (LinkedIn/Facebook/X/copy — exact set TBD against Figma icon assets, see Open Questions).

**3. TOC restyle stays inside `BlogPostSidebar`, adds sticky + active-item accent.**
Add `sticky top-[some-offset]` to the TOC container (currently static) and replace the current text-color-only active state (`blog-post-sidebar.tsx:55-56`) with the Figma treatment: `secondary-50` background + `border-l-[3px] border-secondary-500` + `text-secondary-500` on the active item. Numbering (`01`, `02`, ...) replaces whatever marker is used today — confirm current TOC data already carries an index (`toc` items per the existing IntersectionObserver logic) or derive it from array position.

**4. FAQ becomes a shared component, promoted out of `courses/`.**
Move (or re-export) `CourseFaq`'s open/close pattern into a location usable by both courses and blog — either generalize in place (`src/components/courses/course-faq.tsx` already takes generic props, so blog can import it directly) or extract to `src/components/shared/faq-accordion.tsx` if reused a third time later. Default to importing `CourseFaq` as-is from blog to avoid unnecessary churn; revisit extraction only if a third consumer appears.
FAQ content source: Figma shows FAQ as part of the article flow with plus/minus toggles — this requires structured `{question, answer}` data, which plain WP post HTML doesn't provide out of the box. **Two implementation paths, pick one during `tasks.md`:**

- (a) If the WP post HTML contains a recognizable FAQ block markup (e.g., a specific heading pattern or an ACF/Gutenberg FAQ block in the API response), parse it server-side in `fetchBlogPost` and render `CourseFaq` separately from the rest of `ParsedHtml`.
- (b) If not, style plain `<h3>`/`<p>` FAQ content within `ParsedHtml` as static (non-collapsible) Q&A pairs instead, deferring the accordion interaction until the backend/editor actually supports structured FAQ data.
  This is flagged as an Open Question — needs one live WP post with FAQ content inspected before committing to (a) or (b).

**5. Tables and dot-marker lists are prose CSS, not components.**
The salary table (`4040:12580`) and bullet lists with small dot markers (`4040:12475` etc.) are ordinary WP `<table>`/`<ul>` content. Extend `ParsedHtml`'s prose styles (Tailwind `@tailwindcss/typography` overrides or hand-rolled prose classes, whichever this file already uses) to style `table`/`th`/`td` borders (`neutral-80` border, `neutral-20` header background, `Open Sans Bold` header cells) and `ul > li::before` dot markers, rather than building bespoke table/list React components. Keeps authoring simple (any WP table renders correctly) at the cost of not being able to add per-row interactivity later — acceptable since Figma shows static data only.

**6. Related Courses is a new section, sourced like the homepage/courses-listing course grid.**
Add a "Related Courses" section between the article and "More Blogs," using `CourseCard` in a 4-up grid. Data source: reuse whatever hook/service already powers a "popular/related courses" query elsewhere (e.g., courses listing service) rather than inventing new "related-to-this-post" logic — Figma doesn't indicate the relation is post-specific (no shared category badge shown), so a generic "top/latest courses" fetch is sufficient for v1.

**7. "More Blogs" grid count changes 3 → 4.**
`page.tsx:241` currently slices to 3 `BlogCard`s; Figma shows 4. Bump the fetch/slice count; `BlogCard` itself needs no changes.

**8. Footer CTA band requires no change.**
`footer.tsx:170-197` already renders "Training That Works for Your Team" on `neutral-900`, matching the Figma bottom banner, and already appears on this route via the marketing layout. Confirmed visually against the Figma screenshot — no action needed beyond a side-by-side check during implementation.

## Risks / Trade-offs

- [FAQ data shape is unconfirmed — building the accordion against the wrong assumption wastes work] → Inspect one real WP post's `content.rendered` for FAQ-like markup before starting FAQ implementation (first task in tasks.md); fall back to static styling (Decision 4b) if no structured data exists.
- [3-column sticky layout with independently-stuck TOC and share card can visually collide on shorter articles or overlap the footer] → Use `sticky` with a bottom-bounded parent (`self-start` + column-height-limited container) and test against both a short and a very long post.
- [Related Courses adds a second data fetch to an already data-heavy page] → Reuse existing cache-tagged server fetch (`serverApi`/`serverFetch`) with its own revalidate tag so it doesn't block/duplicate the blog post fetch; verify no waterfall (fetch in parallel with `fetchBlogPost`).
- [Reusing `CourseFaq` from `courses/` into `blog/` creates a cross-feature-folder import] → Acceptable short-term per Decision 4; revisit only if a third consumer appears (rule of three).

## Open Questions

- Does `fetchBlogPost`'s WP HTML response ever contain structured FAQ markup (specific block/class), or must FAQ render as static content for v1? Needs one real example post inspected.
- Exact set/order of social share icons (Figma shows 4 icon buttons, icons not legible from metadata alone — confirm via `get_design_context` asset export during implementation).
- What powers "Related Courses" — a fixed "featured" query, or should it later become genuinely related-by-category? Assumed generic/featured for v1 per Decision 6.
- Sticky offset value for TOC/share columns (needs to clear the fixed site header height — check `Header`/`Trusted` component heights already in the codebase).
