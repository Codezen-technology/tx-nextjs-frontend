# GEMINI.md — Developer & Architecture Playbook

## Core Context Engineering Layer (lean-ctx)

<!-- lean-ctx-rules-v9 -->

CRITICAL: ALWAYS use lean-ctx tools instead of native equivalents. This is NOT optional.

| MUST USE                    | NEVER USE                        | Why                                          |
| --------------------------- | -------------------------------- | -------------------------------------------- |
| `ctx_read(path, mode)`      | `Read` / `cat` / `head` / `tail` | Cached, 10 read modes, re-reads ~13 tokens   |
| `ctx_search(pattern, path)` | `Grep` / `rg`                    | Compact, token-efficient results             |
| `ctx_shell(command)`        | `Shell` / `bash` / terminal      | Pattern compression for git/npm/cargo output |
| `ctx_tree(path, depth)`     | `ls` / `find`                    | Compact directory maps                       |

Mode selection: editing → `full` then `diff`; context only → `map` or `signatures`; unsure → `auto`.
Anti-pattern: NEVER use `full` for files you won't edit.

File editing: use native Edit/Write/StrReplace — unchanged. ctx_read replaces READ only.
If Edit requires native Read and Read is unavailable, use `ctx_edit(path, old_string, new_string)` instead.
Write, Delete, Glob → use normally. NEVER loop on Edit failures — switch to ctx_edit immediately.

Fallback only if a lean-ctx tool is unavailable: use native equivalents.
REMINDER: You MUST use lean-ctx tools. NEVER use native Read, Grep, or Shell directly.

<!-- /lean-ctx -->

---

## 1. Project Context & Reference Hierarchy

This project is a **WP → Next.js Headless Migration** for Training Excellence.

### Strict Reference Hierarchy

1. **Figma Design** (`VoTEBKr8x4fWlObjkr7RXg`) → Visual truth (layout, spacing, colors, typography).
2. **Live WP Site** (`https://trainingexcellence.org.uk/`) → Content structure, behavior, and copy/messages.
3. **WP REST API Response** → Raw field names and backend data shape.

**Never copy raw WP markup/CSS. Never deviate from Figma without explicit instruction.**
Refer to `MIGRATION.md` before migrating any pages.

---

## 2. Core Commands & Environments

### Package Manager

We use **`pnpm`** exclusively. Do not run `npm` or `yarn`.

```bash
pnpm dev            # dev server (localhost:3000)
pnpm build          # production build
pnpm typecheck      # tsc --noEmit
pnpm lint           # ESLint analysis
pnpm lint:fix       # ESLint auto-fix
pnpm format         # Prettier write
pnpm format:check   # Prettier check
pnpm test           # Vitest unit tests (run once)
pnpm test:watch     # Vitest watch mode
pnpm test:coverage  # Vitest with coverage
pnpm test:e2e       # Playwright E2E tests (requires dev server running)
```

### Environment Setup

Copy `.env.example` to `.env.local`. Mandatory environment variables:

- `NEXT_PUBLIC_WP_API_URL` — WordPress base URL (no trailing slash, no `/wp-json`).
- `NEXT_PUBLIC_SITE_URL` — The public frontend site URL.

Other environment variables are parsed and validated via `src/lib/env.ts`.

---

## 3. Architecture & Routing

### Route Groups (`src/app/[locale]/`)

Clean URLs are preserved using `next-intl` with `localePrefix: "as-needed"`.

| Group         | Path                                      | Purpose / Characteristics                     |
| ------------- | ----------------------------------------- | --------------------------------------------- |
| `(marketing)` | `/`                                       | Public, Server-Side Rendered (SSR)            |
| `(auth)`      | `/login`, `/register`, `/forgot-password` | Bounces authenticated users to `/dashboard`   |
| `(student)`   | `/dashboard`, `/courses`, `/profile`      | Protected user space, uses `SiteShell` layout |
| `(learn)`     | `/learn/[courseId]/[unitId]`              | Full-screen immersive unit player             |

### Proxy Middleware

`src/proxy.ts` (Next.js 16 proxy) is executed on the `nodejs` runtime (does not support edge). It reads the non-httpOnly `user_logged_in=1` cookie as the auth signal and runs next-intl for all non-protected routes.

---

## 4. BFF Security Model

To prevent token exposure, JWT/access tokens **never** reach browser-side JS:

```
Browser
  ↓ credentials:include
/api/* BFF routes (src/app/api/)
  ↓ reads httpOnly access_token cookie
proxyToWP()  (src/lib/api/bff.ts)
  ↓ Authorization: Bearer [access_token] auto-refreshes on 401
WordPress REST API  /wp-json/lms-backend/v1/*
```

- **Client Mutations**: Use `bffJson()` from `src/lib/api/bff-client.ts` (sets `credentials: "include"`).
- **Server Components**: Use `serverApi` / `serverFetch` from `src/lib/api/server.ts` (pre-configured server fetching).
- **State Store (`useAuthStore`)**: Stores only `{ user }` display data in `localStorage` under `lms-auth`. No tokens.

---

## 5. Data Flow & Normalization

### Public Reads

Public reads (courses, blog listing) bypass the BFF proxy and fetch directly from WordPress via the Axios client (`src/lib/api/client.ts`) for high performance.

### Normalization Layer

Services in `src/lib/services/` normalize inconsistent WordPress API field names (e.g. `students_count` vs `total_students`) into consistent domain types in `src/types/`. **Do not write field-aliasing logic inside React components.**

- **HTML Entity Decoding**: Always run `rendered` strings (e.g. titles, excerpts) through `decodeEntities()` from `@/lib/api/parsers`.
- **Query Keys**: Centralize TanStack query keys in `src/lib/utils/query-keys.ts`. Never inline string keys.
- **Pagination**: Use `paginate()` from `@/lib/api/parsers`.

---

## 6. Design System & Design Tokens

### Colors

- **Navy (`neutral-900`)**: `#00204A` (Hero backgrounds, headings, navigation)
- **Teal (`primary-500`)**: `#00BBF0` (Category labels, active links)
- **Gold (`secondary-500`)**: `#9E6F21` (CTAs, interactive "Read more" links)
- **Slate (`neutral-500`)**: `#3B5374` (Standard body text)
- **Mid-Gray (`neutral-400`)**: `#667992` (Meta text, dates)
- **Light (`neutral-30`)**: `#EBEDF1` (Borders, dividers)
- **Cream**: `#F5F3EE` (Warm backgrounds for blog and sidebars)
- **White**: `#FFFFFF` (Card and container backgrounds)

### Typography

- **Headings**: `font-suse` (SUSE Bold/Regular)
- **Body & UI**: `font-open-sans` (Open Sans Regular/SemiBold)

---

## 7. Migration & Component Guidelines

1. **Figma Context**: Run `get_design_context` using the node ID from `MIGRATION.md` before migrating.
2. **Server Components**: Server Components are the default. Use `"use client"` sparingly only when browser interactivity or client hooks are needed.
3. **Tailwind Composition**: Always use `cn(...)` from `@/lib/utils/cn` to merge class names safely.
4. **Image Component**: Use `<SafeImage>` or `next/image` to gracefully handle broken or empty WordPress image paths.
5. **No Inline Styling**: Rely entirely on Tailwind utility classes. Do not introduce custom colors/fonts outside `tailwind.config.ts`.
6. **SEO Integration**: Every public server-rendered page must export `generateMetadata` utilizing `fetchRankMathSeo` + `buildPageMetadata` from `@/lib/seo/server` as detailed in `SEO.md`.
