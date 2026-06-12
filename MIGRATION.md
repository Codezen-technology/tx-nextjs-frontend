# WP → Next.js Headless Migration Guide

## Reference Hierarchy (STRICT ORDER)

```
1. Figma design          → visual truth (layout, spacing, colors, typography)
2. Live WP site          → content structure, behavior, edge cases
3. WP REST API response  → exact field names and data shape
```

**Never copy WP markup/CSS. Never deviate from Figma without explicit instruction.**

---

## Figma File

**File:** `VoTEBKr8x4fWlObjkr7RXg` — Training Excellence Website UI/UX  
**Dev URL:** `https://www.figma.com/design/VoTEBKr8x4fWlObjkr7RXg/Training-Excellence---Website-UI-UX`

### Page Node IDs

#### Marketing (public)

| Page                     | Figma Node   | Route                   | Status         |
| ------------------------ | ------------ | ----------------------- | -------------- |
| Home Page                | `89:9557`    | `/`                     | ✅ Done        |
| All Courses              | `185:8697`   | `/all-courses`          | ✅ Done        |
| Single Course Page       | `256:11786`  | `/course/[slug]`        | 🔄 In Progress |
| Category Page            | `365:16934`  | `/course-cat/[slug]`    | ✅ Done        |
| Industry Page            | `394:21834`  | `/industry/[slug]`      | ⬜ Todo        |
| Course Selector          | `172:15780`  | `/course-selector`      | ⬜ Todo        |
| Bundle/Career Bundle     | `389:21117`  | `/bundle/[slug]`        | ⬜ Todo        |
| Search (results)         | `389:14281`  | `/search?q=...`         | ✅ Done        |
| Search (no results)      | `389:17343`  | `/search?q=...`         | ✅ Done        |
| Blog (listing)           | `4900:75788` | `/blog`                 | ✅ Done        |
| Blog (single post)       | `4040:11134` | `/blog/[slug]`          | ✅ Done        |
| About Us                 | `649:22654`  | `/about`                | ✅ Done        |
| Contact Us               | `651:23101`  | `/contact`              | ✅ Done        |
| Certificate Verification | `668:34996`  | `/verify-certificate`   | ✅ Done        |
| Reviews                  | `668:24777`  | `/reviews`              | ✅ Done        |
| Privacy Policy           | —            | `/privacy-policy`       | ✅ Done        |
| Terms & Conditions       | `651:46906`  | `/terms-and-conditions` | ✅ Done        |
| FAQ/Help                 | `651:50517`  | `/help`                 | ✅ Done        |
| Pricing                  | `3209:25908` | `/pricing`              | ⬜ Todo        |
| Training Teams           | —            | `/training-teams`       | ⬜ Todo        |

#### Auth

| Page            | Figma Node | Route              | Status  |
| --------------- | ---------- | ------------------ | ------- |
| Login           | `172:5296` | `/login`           | ✅ Done |
| Register        | `170:6803` | `/register`        | ✅ Done |
| Forgot Password | `172:5611` | `/forgot-password` | ✅ Done |
| Reset Password  | —          | `/reset-password`  | ✅ Done |

#### Shop

| Page           | Figma Node  | Route                      | Status  |
| -------------- | ----------- | -------------------------- | ------- |
| Cart           | `283:12303` | `/cart`                    | ✅ Done |
| Checkout       | `361:13937` | `/checkout`                | ✅ Done |
| Order Received | `363:16133` | `/order-confirmation/[id]` | ✅ Done |

#### Student (protected)

| Page             | Figma Node | Route                                 | Status  |
| ---------------- | ---------- | ------------------------------------- | ------- |
| Dashboard        | —          | `/dashboard`                          | ✅ Done |
| My Learning      | —          | `/dashboard/my-learning`              | ✅ Done |
| My Orders        | —          | `/dashboard/my-orders`                | ✅ Done |
| Profile          | —          | `/dashboard/profile`                  | ✅ Done |
| Subscription     | —          | `/dashboard/subscription`             | ✅ Done |
| Course Catalogue | —          | `/dashboard/all-courses`              | ✅ Done |
| My Courses       | —          | `/courses`                            | ✅ Done |
| Admin: Plans     | —          | `/dashboard/admin/subscription-plans` | ✅ Done |

#### Learn (full-screen player)

| Page         | Figma Node | Route                        | Status  |
| ------------ | ---------- | ---------------------------- | ------- |
| Unit Player  | —          | `/learn/[courseId]/[unitId]` | ✅ Done |
| Course Start | —          | `/learn/[courseId]/start`    | ✅ Done |

#### Errors

| Page           | Figma Node  | Route / File    | Status  |
| -------------- | ----------- | --------------- | ------- |
| 404 Not Found  | `172:11639` | `not-found.tsx` | ✅ Done |
| Error Boundary | —           | `error.tsx`     | ✅ Done |
| Maintenance    | `172:10229` | —               | ⬜ Todo |

---

## Design Tokens (from Figma — verified)

### Colors

| Token     | Hex      | Usage                                    |
| --------- | -------- | ---------------------------------------- |
| `#00204A` | navy     | `neutral-900` — hero bg, headings, nav   |
| `#00BBF0` | teal     | `primary-500` — category labels, links   |
| `#9E6F21` | gold     | `secondary-500` — CTAs, "Read more"      |
| `#3B5374` | slate    | `neutral-500` — body text                |
| `#667992` | mid-gray | `neutral-400` — meta, dates              |
| `#EBEDF1` | light    | `neutral-30` — borders, dividers         |
| `#F5F3EE` | cream    | warm section backgrounds (blog, sidebar) |
| `#FFFFFF` | white    | card backgrounds                         |

### Typography

| Token            | Font      | Usage                  |
| ---------------- | --------- | ---------------------- |
| `font-suse`      | SUSE      | All headings           |
| `font-open-sans` | Open Sans | Body, UI, labels, meta |

**Card title:** SUSE Bold 20px (`text-xl font-bold`)  
**Body text:** Open Sans Regular 16px (`text-base`)  
**Meta/label:** Open Sans SemiBold 14px (`text-sm font-semibold`)

---

## Blog Implementation Notes

### Blog List (`/blog`) — node `4900:75788`

- Hero: dark navy `#00204A` + dot-grid texture, heading + subtitle left, search bar right
- "Trending Topics" section on cream `#F5F3EE` — first post as split card (image left / content right)
- Category sections: each has `font-suse` heading + "View more →" link, 4-col `BlogCard` grid
- Data: `fetchBlogPageGrouped(40)` — fetches posts + categories, groups by first category (4 per)
- Fallback: flat grid if WP returns no category data

### Blog Card — Figma node `4095:76556`

- Fixed `h-[200px]` image, rounded top
- Row: category name `text-primary-500` + `•` + date `text-neutral-400`, `text-sm font-semibold`
- Title: SUSE Bold `text-xl`, `#00204A`, 2-line clamp
- Excerpt: Open Sans Regular `text-base`, `#3B5374`, 3-line clamp
- "Read more →" in `text-secondary-500`

### Blog Single (`/blog/[slug]`) — node `4040:11134`

- Hero: dark navy `#00204A` + dot-grid, breadcrumb (Home → Blog → Category → Title), category pill, author + date
- Layout: 2-col flex on desktop — sticky `lg:w-72` sidebar (left) + article (right)
- **ToC**: `parseToc()` in `src/lib/utils/toc.ts` — h2 only, injects IDs, `IntersectionObserver` highlights active
- **Contributors**: author avatar + name + description from `_embedded.author`
- Related posts on `#F5F3EE` background
- `fetchCategories()` used for category name lookup in breadcrumb + related cards

---

## Search Implementation Notes

### Header Autocomplete

- `CourseSearch` component in `src/components/layout/header.tsx`
- 300ms debounced fetch → `GET /api/search/suggestions?q=...`
- Dropdown: up to 8 suggestions, keyboard nav (↑↓ Enter Escape), close on outside click
- Click suggestion → `/course/[slug]`
- Submit / "See all results" → `/search?q=...`

### BFF Route — `GET /api/search/suggestions`

- File: `src/app/api/search/suggestions/route.ts`
- Proxies to `lms-backend/v1/courses?search=q&per_page=8` server-side
- Normalizes WP envelope (`{ success, data: { items } }`) → `{ results: [{id, title, slug}] }`

### Search Results Page — `/search`

- File: `src/app/[locale]/(marketing)/search/page.tsx`
- `force-dynamic` SSR — reads `searchParams.q`
- Courses section: `serverApi.courses.list({ search: q, per_page: 12 })` → `CourseCard` grid
- Articles section: `fetchBlogPage` client-filtered by keyword → `BlogCard` grid
- Empty state for no results or empty query
- `robots: { index: false }` — search pages not indexed

---

## URL Slug Decisions

| Live WP URL             | Headless Route          |
| ----------------------- | ----------------------- |
| `/privacy-policy`       | `/privacy-policy`       |
| `/terms-and-conditions` | `/terms-and-conditions` |
| `/?s=query`             | `/search?q=query`       |
| `/blog/category/[slug]` | `/blog/category/[slug]` |
| `/course/[slug]`        | `/course/[slug]`        |

**Rule:** match live WP slug exactly unless Figma specifies otherwise.

---

## AI Rules for Every Page Migration

### Before coding

1. Call `get_design_context` on the Figma node ID for the page
2. Read `API_REFERENCE.md` for relevant endpoints
3. Check `src/lib/api/endpoints.ts` — add new endpoints there, never inline

### Layout rules

- Max content width: `max-w-[1296px] mx-auto px-4`
- Main column: `lg:max-w-[966px]` (966px)
- Sidebar: `lg:w-[307px]` (307px) — blog single uses `lg:w-72`
- Gap between columns: `gap-6`
- Route group: public pages → `(marketing)`, protected → `(student)`, auth → `(auth)`

### Component rules

- Server Components by default — use `"use client"` only when needed (interactivity, hooks)
- All class merging via `cn(...)` from `@/lib/utils/cn`
- All images via `<SafeImage>` (handles broken/missing src gracefully) or `next/image`
- WP text fields: always run through `decodeEntities()` from `@/lib/api/parsers`
- Never add a new color/font not in `tailwind.config.ts`

### Data rules

- New endpoints → add to `src/lib/api/endpoints.ts` first
- New service calls → add to `src/lib/services/`
- New query keys → add to `src/lib/utils/query-keys.ts` (never inline strings)
- Pagination → use `paginate()` from `@/lib/api/parsers`
- Server Component data → use `serverApi` / `serverFetch` from `@/lib/api/server`
- Client mutations → use `bffJson()` from `@/lib/api/bff-client`

### What to use live WP site for

- Verify content structure and field presence
- Test edge cases (empty fields, very long titles, missing images)
- Check exact copy/wording for labels and messages
- Confirm behavior of cart, enrollment, quiz flows
- Reference: `https://trainingexcellence.org.uk/`

### What NOT to do

- Do NOT copy WP theme CSS or markup
- Do NOT add inline styles — use Tailwind only
- Do NOT add features beyond what Figma shows
- Do NOT use `npm` or `yarn` — always `pnpm`
- Do NOT add error handling for impossible cases
- Do NOT add comments explaining what code does — only add comments for non-obvious WHY

---

## Per-Page Migration Checklist

For each page:

- [ ] Fetch Figma design context (`get_design_context nodeId=X fileKey=VoTEBKr8x4fWlObjkr7RXg`) <!-- cspell:disable-line -->
- [ ] Identify API endpoints needed → check `API_REFERENCE.md`
- [ ] Create page file in correct route group
- [ ] Build layout from Figma (Server Component)
- [ ] Add client interactivity where needed (`"use client"`)
- [ ] Wire data from WP REST API
- [ ] Handle loading/empty/error states
- [ ] Run `pnpm typecheck` — zero errors
- [ ] Cross-check against live WP site for edge cases
- [ ] Mark node as ✅ Done in this file

---

## Architecture Reminder

```
Browser
  ↓ credentials:include
/api/* BFF routes
  ↓ reads httpOnly access_token cookie
proxyToWP() → src/lib/api/bff.ts
  ↓ Authorization: Bearer
WordPress REST API /wp-json/lms-backend/v1/*
```

- Public reads: Axios client direct to WP (no BFF)
- Authenticated mutations: through `/api/*` BFF routes
- Tokens: never in browser JS — httpOnly cookies only
- Auth gate: `user_logged_in=1` cookie (non-httpOnly) checked in middleware

---

## Completed Decisions (do not re-litigate)

| Decision                  | Choice                                                             | Why                                                                                                      |
| ------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| CSS framework             | Tailwind CSS                                                       | Already in codebase                                                                                      |
| Component style           | Server Components first                                            | Performance, SEO                                                                                         |
| Image component           | `<SafeImage>` wrapping `next/image`                                | Handles WP broken image URLs                                                                             |
| Purchase card             | "For me" + "For teams" tabs                                        | Matches Figma 256:14065                                                                                  |
| Banner layout             | Course info inside dark banner, sidebar overlaps via `-mt-[428px]` | Matches Figma node 256:11832/14065                                                                       |
| Below-banner section      | None on desktop, `CourseOverview` mobile-only                      | Avoids content duplication                                                                               |
| Button text               | "Buy this course"                                                  | Matches live site                                                                                        |
| Feature checklist         | 100% online, Duration, CPD Points, Free Digital Certificate        | Matches live site                                                                                        |
| Blog ToC depth            | h2 only (not h3)                                                   | Matches live site `https://trainingexcellence.org.uk/blog/how-to-get-a-nursing-assistant-certification/` |
| Privacy slug              | `/privacy-policy` (not `/privacy`)                                 | Matches live WP slug                                                                                     |
| Terms slug                | `/terms-and-conditions` (not `/terms`)                             | Matches live WP slug                                                                                     |
| Search URL                | `/search?q=...` (not `/?s=...`)                                    | Clean headless URL; WP native `?s=` not used                                                             |
| Search suggestions source | `lms-backend/v1/courses` (not WP native search)                    | Returns LMS-normalized course data                                                                       |
| Blog category grouping    | Group by `categories[0]`, show 4 per category                      | Matches Figma blog list section pattern                                                                  |
