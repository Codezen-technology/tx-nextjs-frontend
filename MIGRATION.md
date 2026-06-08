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

| Page                     | Figma Node   | Status         |
| ------------------------ | ------------ | -------------- |
| Home Page                | `89:9557`    | ✅ Done        |
| Single Course Page       | `256:11786`  | 🔄 In Progress |
| All Courses (v2)         | `185:8697`   | ⬜ Todo        |
| Category Page            | `365:16934`  | ⬜ Todo        |
| Industry Page            | `394:21834`  | ⬜ Todo        |
| Course Selector          | `172:15780`  | ⬜ Todo        |
| Bundle/Career Bundle     | `389:21117`  | ⬜ Todo        |
| Search (with results)    | `389:14281`  | ⬜ Todo        |
| Search (no results)      | `389:17343`  | ⬜ Todo        |
| Login                    | `172:5296`   | ⬜ Todo        |
| Register                 | `170:6803`   | ⬜ Todo        |
| Forgot Password          | `172:5611`   | ⬜ Todo        |
| Cart                     | `283:12303`  | ⬜ Todo        |
| Checkout                 | `361:13937`  | ⬜ Todo        |
| Order Received           | `363:16133`  | ⬜ Todo        |
| Blog (listing)           | `648:21070`  | ⬜ Todo        |
| Blog (single)            | `648:31357`  | ⬜ Todo        |
| About Us                 | `649:22654`  | ⬜ Todo        |
| Contact Us               | `651:23101`  | ⬜ Todo        |
| Certificate Verification | `668:34996`  | ⬜ Todo        |
| Reviews                  | `668:24777`  | ⬜ Todo        |
| T&C                      | `651:46906`  | ⬜ Todo        |
| FAQ/Help                 | `651:50517`  | ⬜ Todo        |
| Pricing                  | `3209:25908` | ⬜ Todo        |
| Error 404                | `172:11639`  | ⬜ Todo        |
| Error Maintenance        | `172:10229`  | ⬜ Todo        |

---

## Design Tokens (from Figma)

```
Primary:     #00204A (dark navy)
Secondary:   #8B6B2A (gold/olive)
secondary-50: #F5F1E9 (cream — banner wave destination)
Neutral-10:  light gray strip background
```

**Fonts:**

- Headings: `font-suse` (SUSE)
- Body/UI: `font-open-sans` (Open Sans)

---

## AI Rules for Every Page Migration

### Before coding

1. Call `get_design_context` on the Figma node ID for the page
2. Read `API_REFERENCE.md` for relevant endpoints
3. Check `src/lib/api/endpoints.ts` — add new endpoints there, never inline

### Layout rules

- Max content width: `max-w-[1296px] mx-auto px-4`
- Main column: `lg:max-w-[966px]` (966px)
- Sidebar: `lg:w-[307px]` (307px)
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

- [ ] Fetch Figma design context (`get_design_context nodeId=X fileKey=VoTEBKr8x4fWlObjkr7RXg`)
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

| Decision             | Choice                                                               | Why                                |
| -------------------- | -------------------------------------------------------------------- | ---------------------------------- |
| CSS framework        | Tailwind CSS                                                         | Already in codebase                |
| Component style      | Server Components first                                              | Performance, SEO                   |
| Image component      | `<SafeImage>` wrapping `next/image`                                  | Handles WP broken image URLs       |
| Purchase card        | "For me" + "For teams" tabs                                          | Matches Figma 256:14065            |
| Banner layout        | Course info inside dark banner, sidebar overlaps via `-mt-[428px]`   | Matches Figma node 256:11832/14065 |
| Below-banner section | None on desktop (banner has full info), `CourseOverview` mobile-only | Avoids content duplication         |
| Button text          | "Buy this course"                                                    | Matches live production site       |
| Feature checklist    | 100% online, Duration, CPD Points, Free Digital Certificate          | Matches live production site       |
