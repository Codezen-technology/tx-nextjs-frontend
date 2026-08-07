# Headless LMS Frontend — Next.js Project Plan

> Owner: Engineering · Author: Senior Engineering · Status: **Active Plan**
> Reference implementation: <https://trainingexcellence.org.uk/>
> Backend plugin: `lms-backend-rest-api` (see: <https://github.com/Codezen-technology/wp-lms-backend-rest-api>)
> API namespace: `lms-backend/v1` · Auth: JWT (firebase/php-jwt v7, HS256) · Wraps WPLMS + WooCommerce + BuddyPress
> **Reusability goal:** This frontend is designed to be deployed against **any** WordPress site running the `lms-backend-rest-api` plugin with zero code changes — configuration only.

---

## 0. Reality Check (read this first)

The existing scaffold under `src/` is a clean Next 14 starter, but **it was wired to a generic LMS plugin, not this one**. Three things are wrong out of the box and will produce 404s on day one if shipped as-is:

| What the code does                                     | What `lms-backend/v1` actually does                                                                     | Impact                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Hits `/${LMS_NAMESPACE}/courses` with default `lms/v1` | Real namespace is `lms-backend/v1`                                                                      | 100% of LMS calls 404            |
| Hits `/jwt-auth/v1/token` (Toranj/JWT plugin)          | Real auth is `POST /lms-backend/v1/auth/login` with `{ access_token, refresh_token, expires_in, user }` | Login broken, no refresh logic   |
| Treats `data` as a flat array                          | API wraps everything: `{ success: true, data: { items, total, page, per_page, totalPages } }`           | All list endpoints break parsers |
| Calls "lessons" everywhere                             | Backend post type is `unit` and the route is `/units/{id}`                                              | Lesson player breaks             |

We fix that in P0 below. **No new pages get built until the API layer matches the contract in `LMS_API_PLAN.md`.**

The live site (`trainingexcellence.org.uk`) is a paid LMS — courses at £29–£49, slashed RRP, "Premium Access" subscription, Business plan. **There is no checkout endpoint on the backend yet** (§11 in `LMS_API_PLAN.md`). That is the single biggest blocker; everything else is solvable in a sprint.

---

## 1. Goals (in scope) and Non-Goals

**In scope (V1 launch parity with `trainingexcellence.org.uk`):**

- Public marketing site (Home, Courses, Course Detail, Categories, Bundles, About, Contact, Blog list+single)
- Search with autocomplete
- Membership / pricing page (Monthly, Premium, Business)
- Auth: register, login, forgot/reset password, refresh-token rotation
- Student dashboard: enrolled courses, per-course progress, certificates, profile
- Lesson player with quiz + assignment submission
- Reviews (read + write for enrolled users)
- Cart, checkout, payment, order confirmation, order history
- Auto-enrol on `woocommerce_order_status_completed`
- Newsletter subscribe (Mailchimp/SendGrid behind a Next route handler)
- SEO: SSR/ISR, structured data (Course, Organization, BreadcrumbList, Review), sitemap, robots
- Light/dark theme, accessibility AA, Lighthouse ≥ 90 on LCP/CLS/TBT for marketing pages

**Out of scope (V1):**

- Instructor and admin tooling (P4 in `LMS_API_PLAN.md`)
- SCORM/xAPI playback (handled natively by WPLMS, not in this UI)
- Mobile native apps (the same API supports them later)
- Live cohorts, forums, BuddyPress activity stream

---

## 1b. White-Label / Multi-Site Architecture

**Goal:** Deploy this frontend against any WordPress site running `lms-backend-rest-api` with **zero code changes** — configuration and CMS content only.

### What must NOT be hardcoded

| Data                                       | Where it comes from                                                             | Implementation                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Site name, tagline, description            | Backend `/lms-backend/v1/settings` (new) or `wp/v2/settings`                    | Fetch at build time via `generateMetadata()`, cache in env at deploy |
| Logo (light + dark variants)               | Backend `/settings` or env `NEXT_PUBLIC_LOGO_URL` / `NEXT_PUBLIC_LOGO_DARK_URL` | Fallback to text if not set                                          |
| Primary/accent colors                      | Backend `/settings` → CSS variables or env `NEXT_PUBLIC_PRIMARY_COLOR`          | Injected into `:root` via `layout.tsx`                               |
| Hero headline, subheadline, CTA            | WP page with slug `home` or a dedicated `site_content` CPT                      | Fetch in RSC, render dynamically                                     |
| Pricing plans (Monthly, Premium, Business) | Backend `/memberships/plans` (WC Subscriptions wrapper)                         | **Never hardcode** — fetch and render from API                       |
| Footer links, social URLs                  | Backend `/settings` or WP menu via `wp/v2/menus`                                | Configurable per site                                                |
| Testimonials                               | `wp/v2/testimonial` CPT                                                         | Already CMS-driven ✓                                                 |
| Partner logos                              | `wp/v2/partner_logo` CPT                                                        | Already CMS-driven ✓                                                 |
| Contact email, address, phone              | Backend `/settings`                                                             | Display on `/contact`, footer                                        |
| Currency symbol, locale                    | Backend `/settings` → `currency: "GBP"`, `locale: "en-GB"`                      | Format prices with `Intl.NumberFormat`                               |
| Blog categories, featured posts            | `wp/v2/posts`, `wp/v2/categories`                                               | Already dynamic ✓                                                    |
| Favicon, OG image                          | Backend `/settings` or env                                                      | `app/icon.tsx`, `app/opengraph-image.tsx` read from config           |

### New backend endpoint: `GET /lms-backend/v1/settings`

This is the **single source of truth** for site-specific configuration. Returns:

```json
{
  "site_name": "Training Excellence",
  "tagline": "Get Skilled, Get Certified",
  "description": "High-quality compliance training...",
  "logo_url": "https://cdn.example.com/logo.svg",
  "logo_dark_url": "https://cdn.example.com/logo-dark.svg",
  "favicon_url": "https://cdn.example.com/favicon.ico",
  "og_image_url": "https://cdn.example.com/og.jpg",
  "primary_color": "#2563eb",
  "accent_color": "#f59e0b",
  "contact_email": "info@trainingexcellence.org.uk",
  "contact_phone": "+44 123 456 7890",
  "contact_address": "London, UK",
  "social": {
    "facebook": "https://facebook.com/...",
    "twitter": "https://twitter.com/...",
    "linkedin": "https://linkedin.com/..."
  },
  "currency": "GBP",
  "locale": "en-GB",
  "features": {
    "memberships": true,
    "bundles": true,
    "certificates": true,
    "badges": false,
    "reviews": true,
    "blog": true
  }
}
```

**Backend ticket:** Add `Settings_Controller` exposing site options. Read from `get_option()` — can be managed via WP Customizer, ACF Options page, or a dedicated settings screen in wp-admin.

### Feature flags

The `features` object above controls what the frontend renders:

| Flag           | Effect when `false`                                    |
| -------------- | ------------------------------------------------------ |
| `memberships`  | Hide `/pricing` page, show only single-course purchase |
| `bundles`      | Hide `/bundles` routes                                 |
| `certificates` | Hide certificates section in dashboard                 |
| `badges`       | Hide badges section                                    |
| `reviews`      | Hide review submission (read-only or hidden)           |
| `blog`         | Hide `/blog` routes, remove from nav                   |

Frontend reads `features` from `/settings` at build time (ISR) and conditionally renders nav items, pages, and components. **No code change required to enable/disable features per site.**

### Theming via CSS variables

Instead of hardcoded Tailwind colors, inject site-specific colors at runtime:

```tsx
// app/[locale]/layout.tsx
const settings = await fetchSettings();

<html style={{
  '--primary': settings.primary_color,
  '--accent': settings.accent_color,
}}>
```

Tailwind config references these:

```ts
// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: 'var(--primary, hsl(var(--primary-hsl)))',
    // ...shades generated via color-mix or predefined
  },
}
```

**Fallback:** If `/settings` fails or colors aren't set, fall back to the default shadcn theme (already in `globals.css`).

### Deployment model

Two options supported:

1. **One repo, many deploys (recommended for V1)**
   - Clone repo, set env vars, deploy to Vercel/Netlify
   - Each site = separate Vercel project pointing to same repo
   - Site-specific config via env vars + `/settings` endpoint

2. **Multi-tenant single deploy (future)**
   - Single deployment serves multiple domains
   - Middleware reads `Host` header → fetches site-specific `/settings` from matching WP backend
   - Requires backend to support site lookup by domain
   - Out of scope for V1, but architecture doesn't preclude it

### Environment variables for white-label

Update `.env.example`:

```bash
# === REQUIRED ===
NEXT_PUBLIC_WP_API_URL=https://your-wp-site.com
NEXT_PUBLIC_SITE_URL=https://your-frontend.com

# === OPTIONAL OVERRIDES (fallback to /settings endpoint) ===
NEXT_PUBLIC_SITE_NAME=
NEXT_PUBLIC_LOGO_URL=
NEXT_PUBLIC_LOGO_DARK_URL=
NEXT_PUBLIC_PRIMARY_COLOR=
NEXT_PUBLIC_ACCENT_COLOR=
NEXT_PUBLIC_CURRENCY=GBP
NEXT_PUBLIC_LOCALE=en-GB

# === FEATURE FLAGS (override /settings if set) ===
NEXT_PUBLIC_FEATURE_MEMBERSHIPS=true
NEXT_PUBLIC_FEATURE_BUNDLES=true
NEXT_PUBLIC_FEATURE_CERTIFICATES=true
NEXT_PUBLIC_FEATURE_BADGES=false
NEXT_PUBLIC_FEATURE_REVIEWS=true
NEXT_PUBLIC_FEATURE_BLOG=true

# === API ===
NEXT_PUBLIC_LMS_NAMESPACE=lms-backend/v1

# === PAYMENTS ===
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# === MONITORING ===
SENTRY_DSN=
```

Env vars **override** `/settings` response — useful for quick testing or sites that don't have the settings endpoint yet.

### Checklist for deploying to a new site

1. Install `lms-backend-rest-api` plugin on WordPress
2. Configure plugin: set `JWT_AUTH_SECRET_KEY`, enable CORS for frontend domain
3. Populate site settings in wp-admin (or via ACF Options)
4. Create CPT content: testimonials, partner logos
5. Clone frontend repo
6. Set env vars: `NEXT_PUBLIC_WP_API_URL`, `NEXT_PUBLIC_SITE_URL`, Stripe key
7. Deploy to Vercel/Netlify
8. Verify `/settings` endpoint returns correct data
9. Done — no code changes required

---

## 2. Tech Stack (locked)

The scaffold's choices are correct. Keep them. Notes added.

| Layer            | Choice                                                          | Why                                                         |
| ---------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| Framework        | Next.js 14 App Router                                           | RSC + per-route caching match a content-heavy LMS           |
| Language         | TypeScript strict, `noUncheckedIndexedAccess` (add)             | Stops the "object is possibly undefined" class of bugs cold |
| Styling          | Tailwind + shadcn primitives                                    | Already wired; matches the live site's utility-driven look  |
| Server state     | TanStack Query v5                                               | SSR hydration + mutation invalidation are first-class       |
| Auth/UI state    | Zustand + `persist` + cookie mirror                             | Cookie is what `middleware.ts` reads; do not remove it      |
| Forms            | React Hook Form + Zod                                           | Single source of truth for schema + types                   |
| HTTP             | `axios` singleton + interceptors                                | Already wired; needs unwrap interceptor (see §4)            |
| Theming          | `next-themes`                                                   | OK                                                          |
| Icons            | `lucide-react`                                                  | OK                                                          |
| Toasts           | `sonner`                                                        | OK                                                          |
| Payments (web)   | Stripe Elements (via `@stripe/react-stripe-js`)                 | Card fields stay PCI-SAQ-A; backend issues PaymentIntents   |
| Analytics        | Vercel Analytics + GA4 (consent-gated)                          | Add a thin `useAnalytics` hook                              |
| Error monitoring | Sentry (browser + edge + server)                                | Wire into `instrumentation.ts` and `error.tsx`              |
| Image            | `next/image` with `remotePatterns` for WP host + CDN            | Already configured                                          |
| Testing          | Vitest + React Testing Library + Playwright (E2E)               | Add `vitest`, `@testing-library/*`, `playwright`            |
| Linting          | ESLint Next preset + Prettier + tw plugin + Husky + lint-staged | Already wired                                               |

**Add to `package.json` (Phase 0):**

```bash
npm i @stripe/stripe-js @stripe/react-stripe-js @tanstack/react-query@^5.100 dompurify isomorphic-dompurify @sentry/nextjs next-intl
npm i -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test msw
```

**Note:** We don't need `jose` for JWT verification — the BFF forwards tokens to WordPress which validates them. If you later need to decode tokens server-side (e.g., for caching decisions), add `jose` then.

---

## 3. Architecture

### 3.1 Hybrid Proxy Pattern (Recommended Standard)

For a production LMS with authentication, payments, and user data, use **Next.js API routes as a Backend-for-Frontend (BFF)** for authenticated operations while keeping public data fetches direct.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                        │
│  ┌─────────────────────────┐     ┌─────────────────────────────────────┐   │
│  │   Server Components     │     │      Client Components              │   │
│  │   (RSC, ISR pages)      │     │   (Dashboard, Cart, Learn)          │   │
│  └───────────┬─────────────┘     └───────────────┬─────────────────────┘   │
└──────────────┼───────────────────────────────────┼─────────────────────────┘
               │                                   │
               │ fetch() server-side               │ fetch('/api/...')
               │ (no auth needed)                  │ (credentials: 'include')
               │                                   │
               ▼                                   ▼
┌──────────────────────────┐        ┌─────────────────────────────────────────┐
│   WordPress REST API     │        │     Next.js API Routes (BFF Proxy)      │
│   (public endpoints)     │        │                                         │
│                          │        │  • Reads httpOnly cookie                │
│  /lms-backend/v1/courses │        │  • Attaches Authorization header        │
│  /lms-backend/v1/reviews │        │  • Handles token refresh                │
│  /wp/v2/posts            │        │  • Unwraps response envelope            │
│  /lms-backend/v1/settings│        │  • Normalizes errors                    │
└──────────────────────────┘        └───────────────┬─────────────────────────┘
                                                    │
                                                    │ fetch() server-side
                                                    │ with Bearer token
                                                    ▼
                                    ┌─────────────────────────────────────────┐
                                    │    WordPress REST API                   │
                                    │    (protected endpoints)                │
                                    │                                         │
                                    │  /lms-backend/v1/users/me               │
                                    │  /lms-backend/v1/users/me/progress      │
                                    │  /lms-backend/v1/courses/{id}/enroll    │
                                    │  /lms-backend/v1/units/{id}/content     │
                                    │  /lms-backend/v1/quizzes/{id}/submit    │
                                    │  /lms-backend/v1/cart                   │
                                    │  /lms-backend/v1/orders                 │
                                    └─────────────────────────────────────────┘
```

### 3.2 Why This Pattern

| Benefit                | Explanation                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| **httpOnly cookies**   | Tokens never touch client JavaScript — immune to XSS token theft  |
| **Automatic refresh**  | BFF handles 401 → refresh → retry transparently                   |
| **No CORS headaches**  | Browser talks to same origin; server talks to WP                  |
| **Hidden backend URL** | Attackers don't see your WordPress domain                         |
| **Response shaping**   | Unwrap envelope, normalize errors, add cache headers in one place |
| **Rate limiting**      | Add throttling at the edge before hitting WP                      |

### 3.3 What Goes Where

| Data Type                       | Fetch Method                         | Why                          |
| ------------------------------- | ------------------------------------ | ---------------------------- |
| Course list, detail, curriculum | RSC direct to WP                     | Public, cacheable with ISR   |
| Categories, levels, tags        | RSC direct to WP                     | Public, rarely changes       |
| Reviews (read)                  | RSC direct to WP                     | Public                       |
| Blog posts                      | RSC direct to WP                     | Public                       |
| Site settings                   | RSC direct to WP                     | Public                       |
| **Login, Register**             | **POST `/api/auth/login`**           | Sets httpOnly cookie         |
| **Logout**                      | **POST `/api/auth/logout`**          | Clears cookie, revokes token |
| **Current user profile**        | **GET `/api/users/me`**              | Authenticated                |
| **User progress**               | **GET `/api/users/me/progress`**     | Authenticated                |
| **Enrollments**                 | **`/api/enrollments/*`**             | Authenticated                |
| **Unit content**                | **GET `/api/units/{id}/content`**    | Requires enrollment          |
| **Complete unit**               | **POST `/api/units/{id}/complete`**  | Authenticated                |
| **Quiz start/submit**           | **`/api/quizzes/*`**                 | Authenticated                |
| **Assignment submit**           | **`/api/assignments/*`**             | Authenticated                |
| **Cart operations**             | **`/api/cart/*`**                    | Guest or authenticated       |
| **Checkout, Orders**            | **`/api/orders/*`**                  | Authenticated                |
| **Reviews (create)**            | **POST `/api/courses/{id}/reviews`** | Authenticated                |

### 3.4 Token Flow (Secure)

```
1. User submits login form
   └─► POST /api/auth/login { username, password }

2. Next.js API route:
   └─► POST WordPress /lms-backend/v1/auth/login
   └─► Receives { access_token, refresh_token, user }
   └─► Sets cookies:
       • access_token  (httpOnly, secure, sameSite: 'lax', maxAge: 86400)
       • refresh_token (httpOnly, secure, sameSite: 'lax', maxAge: 604800)
       • user_logged_in (NOT httpOnly, for middleware/client awareness)
   └─► Returns { user } to client (no tokens!)

3. Subsequent authenticated requests:
   └─► Client calls /api/users/me
   └─► BFF reads access_token from cookie
   └─► BFF calls WP with Authorization: Bearer {token}
   └─► On 401: BFF uses refresh_token to get new access_token
   └─► Updates cookie, retries request
   └─► Returns data to client

4. Logout:
   └─► POST /api/auth/logout
   └─► BFF calls WP /auth/logout to revoke refresh token
   └─► Clears all auth cookies
```

### 3.5 Layered Diagram (Updated)

```
Browser (Client Components)
        │
        │  fetch('/api/...', { credentials: 'include' })
        ▼
src/app/api/  ─ Next.js Route Handlers (BFF)
        │        • Reads httpOnly cookies
        │        • Calls WP with Bearer token
        │        • Handles refresh
        │
        ▼
WordPress (lms-backend/v1) ──► MySQL / WC / WPLMS

─────────────────────────────────────────────────────

Server Components (RSC)
        │
        │  fetch('WP_API/...', { next: { revalidate: 300 } })
        ▼
WordPress (lms-backend/v1, wp/v2) ──► cached public data
```

**Hard rules:**

1. UI never stores tokens in localStorage or JS-accessible cookies
2. Client components fetch from `/api/*`, not WP directly (for auth'd data)
3. RSC fetches public data directly from WP (faster, cacheable)
4. All mutations go through `/api/*`

### 3.2 RSC vs Client split

| Page                                             | Render                                            | Data                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `/` (home)                                       | RSC + ISR `revalidate: 300`                       | Featured courses, popular courses, taxonomy, testimonials prefetched server-side, hydrated to React Query cache |
| `/courses` (list)                                | RSC for first page, client for filters/pagination | Initial page SSR, subsequent client-side `useQuery`                                                             |
| `/courses/[slug]`                                | RSC + ISR `revalidate: 600`                       | Detail + curriculum + reviews + stats prefetched in parallel                                                    |
| `/categories/[slug]`                             | RSC + ISR                                         | Category + filtered course list                                                                                 |
| `/bundles`, `/bundles/[slug]`                    | RSC + ISR                                         | Bundle detail with included courses                                                                             |
| `/blog`, `/blog/[slug]`                          | RSC + ISR                                         | Direct `wp/v2/posts`                                                                                            |
| `/cart`, `/checkout`, `/dashboard/*`, `/learn/*` | Client (auth-gated)                               | Live data; no caching                                                                                           |
| `/login`, `/register`, `/forgot-password`        | Client                                            | Forms                                                                                                           |
| `/order/[id]/received`                           | RSC (with auth check)                             | One-shot order fetch                                                                                            |
| `/certificates/verify?code=...`                  | RSC                                               | Public, no auth                                                                                                 |

**Rule of thumb:** if it changes per user (cart, dashboard, learn) it is a client component or a route handler call. Everything else is RSC.

### 3.3 Folder structure (target)

Keep what exists, add what's missing. **Note:** All user-facing routes live under `app/[locale]/` for future i18n support (ships with `en` only).

```
src/
├── app/
│   ├── [locale]/                    ← i18n segment (en only at launch)
│   │   ├── (marketing)/             ← public, SSR/ISR
│   │   │   ├── page.tsx             ← home
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx         ← all courses
│   │   │   │   └── [slug]/page.tsx  ← course detail
│   │   │   ├── categories/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── bundles/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── instructors/
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── pricing/page.tsx     ← Monthly / Premium / Business
│   │   │   ├── business/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx  ← consumes ?key= ?login=
│   │   ├── (student)/               ← auth-gated by middleware
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── courses/page.tsx     ← my enrolled
│   │   │   ├── certificates/page.tsx
│   │   │   ├── badges/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── orders/[id]/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (commerce)/              ← cart/checkout, public-ish
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   ├── order/[id]/received/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (learn)/
│   │   │   └── learn/[courseId]/[unitId]/page.tsx
│   │   ├── certificates/verify/page.tsx ← public, no shell
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   └── layout.tsx               ← NextIntlClientProvider wraps here
│   ├── api/                          ← Next route handlers (BFF) — outside [locale]
│   │   ├── auth/
│   │   │   ├── login/route.ts        ← POST: login, set httpOnly cookies
│   │   │   ├── register/route.ts     ← POST: register, set cookies
│   │   │   ├── logout/route.ts       ← POST: revoke token, clear cookies
│   │   │   ├── refresh/route.ts      ← POST: manual refresh (rarely needed)
│   │   │   ├── forgot-password/route.ts
│   │   │   └── reset-password/route.ts
│   │   ├── users/
│   │   │   └── me/
│   │   │       ├── route.ts          ← GET/PATCH: profile
│   │   │       ├── progress/route.ts ← GET: all course progress
│   │   │       └── enrollments/route.ts ← GET: enrolled courses
│   │   ├── courses/
│   │   │   └── [id]/
│   │   │       ├── enroll/route.ts   ← POST: enroll in course
│   │   │       └── reviews/route.ts  ← POST: create review
│   │   ├── units/
│   │   │   └── [id]/
│   │   │       ├── content/route.ts  ← GET: rendered lesson content
│   │   │       └── complete/route.ts ← POST: mark complete
│   │   ├── quizzes/
│   │   │   └── [id]/
│   │   │       ├── questions/route.ts ← GET: quiz questions
│   │   │       ├── start/route.ts    ← POST: start attempt
│   │   │       ├── submit/route.ts   ← POST: submit answers
│   │   │       └── results/route.ts  ← GET: attempt results
│   │   ├── assignments/
│   │   │   └── [id]/
│   │   │       ├── route.ts          ← GET: assignment detail
│   │   │       ├── submit/route.ts   ← POST: submit assignment
│   │   │       └── status/route.ts   ← GET: submission status
│   │   ├── cart/
│   │   │   ├── route.ts              ← GET/DELETE: cart
│   │   │   ├── items/route.ts        ← POST: add item
│   │   │   └── items/[key]/route.ts  ← PATCH/DELETE: update/remove item
│   │   ├── orders/
│   │   │   ├── route.ts              ← GET/POST: list/create order
│   │   │   └── [id]/
│   │   │       ├── route.ts          ← GET: order detail
│   │   │       └── pay/route.ts      ← POST: process payment
│   │   ├── reviews/
│   │   │   ├── my-reviews/route.ts   ← GET: user's reviews
│   │   │   └── [id]/route.ts         ← PATCH/DELETE: update/delete review
│   │   ├── newsletter/route.ts
│   │   └── revalidate/route.ts       ← on-demand ISR via WP webhook
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── opengraph-image.tsx
│   ├── providers.tsx
│   └── layout.tsx                   ← root layout (html, body, fonts)
├── i18n/
│   ├── request.ts                   ← getRequestConfig for next-intl
│   └── messages/
│       └── en.json                  ← English strings
├── components/
│   ├── ui/                          ← shadcn primitives
│   ├── marketing/                   ← Hero, FeaturedGrid, CategoriesGrid, Pricing, Testimonials, TrustedBy, Newsletter, FAQ
│   ├── courses/
│   ├── lessons/
│   ├── quizzes/
│   ├── assignments/
│   ├── reviews/
│   ├── cart/
│   ├── checkout/
│   ├── dashboard/
│   ├── auth/
│   └── layout/
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── endpoints.ts
│   │   ├── parsers.ts
│   │   ├── error.ts
│   │   └── server.ts                ← server-only fetcher for RSC, no axios
│   ├── services/
│   │   ├── settings.ts               ← site config, theming, feature flags
│   │   ├── auth.ts
│   │   ├── courses.ts
│   │   ├── units.ts                  ← rename from lessons.ts
│   │   ├── quizzes.ts
│   │   ├── assignments.ts
│   │   ├── enrollments.ts
│   │   ├── progress.ts
│   │   ├── reviews.ts
│   │   ├── taxonomy.ts
│   │   ├── instructors.ts
│   │   ├── bundles.ts
│   │   ├── memberships.ts            ← subscription plans
│   │   ├── cart.ts
│   │   ├── orders.ts
│   │   ├── payment.ts
│   │   ├── certificates.ts
│   │   ├── badges.ts
│   │   ├── notifications.ts
│   │   ├── search.ts
│   │   ├── media.ts
│   │   ├── partners.ts               ← trusted-by logos
│   │   ├── testimonials.ts
│   │   └── user.ts
│   ├── hooks/                        ← one per service
│   ├── stores/
│   │   ├── auth.store.ts
│   │   ├── cart.store.ts             ← guest cart mirror
│   │   └── settings.store.ts         ← site config cache (SSR-hydrated)
│   ├── schemas/                      ← zod
│   ├── seo/
│   │   ├── jsonld.ts                 ← Course, Organization, Review, Breadcrumb
│   │   └── metadata.ts
│   └── utils/
├── types/
└── middleware.ts
```

---

## 4. API Contract — what to fix immediately

These changes are **P0**. Without them the entire app is dead.

### 4.1 Environment

`/.env.example` is fine but the namespace default is wrong. Replace:

```bash
# WordPress backend (no trailing slash, no /wp-json suffix)
NEXT_PUBLIC_WP_API_URL=http://lms-site.test
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_LMS_NAMESPACE=lms-backend/v1     # was lms/v1
NEXT_PUBLIC_CDN_URL=                         # optional, matches LMS_BACKEND_API_CDN_URL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
WP_REVALIDATE_SECRET=                        # shared secret for /api/revalidate
NEWSLETTER_PROVIDER_API_KEY=
```

`src/lib/env.ts` → change default:

```ts
LMS_NAMESPACE: process.env.NEXT_PUBLIC_LMS_NAMESPACE ?? "lms-backend/v1",
```

### 4.2 Endpoints

`src/lib/api/endpoints.ts` is rebuilt against the real namespace and the real auth controller. Delete the JWT-plugin paths.

```ts
const lms = `/${env.LMS_NAMESPACE}`; // /lms-backend/v1
const wp = `/wp/v2`;
const swca = `/swca/v1`; // legacy certificate plugin (read-only fallback)

export const endpoints = {
  auth: {
    login: `${lms}/auth/login`,
    register: `${lms}/auth/register`,
    logout: `${lms}/auth/logout`,
    refresh: `${lms}/auth/refresh`,
    forgotPassword: `${lms}/auth/forgot-password`,
    resetPassword: `${lms}/auth/reset-password`,
  },
  user: {
    me: `${lms}/users/me`,
    updateMe: `${lms}/users/me`,
    avatar: `${lms}/users/me/avatar`,
    enrollments: `${lms}/users/me/enrollments`,
    progress: `${lms}/users/me/progress`,
    certificates: `${lms}/users/me/certificates`,
    badges: `${lms}/users/me/badges`,
    notifications: `${lms}/users/me/notifications`,
    publicProfile: (id: number) => `${lms}/users/${id}`,
  },
  courses: {
    list: `${lms}/courses`,
    detail: (id: string | number) => `${lms}/courses/${id}`,
    search: `${lms}/courses/search`,
    featured: `${lms}/courses/featured`,
    popular: `${lms}/courses/popular`,
    free: `${lms}/courses/free`,
    curriculum: (id: string | number) => `${lms}/courses/${id}/curriculum`,
    students: (id: number) => `${lms}/courses/${id}/students`, // instructor only
    instructors: (id: number) => `${lms}/courses/${id}/instructors`,
    // NOT YET IMPLEMENTED: stats, certificate, announcements
  },
  units: {
    list: `${lms}/units`,
    detail: (id: number) => `${lms}/units/${id}`,
    content: (id: number) => `${lms}/units/${id}/content`, // rendered content
    complete: (id: number) => `${lms}/units/${id}/complete`,
  },
  quizzes: {
    list: `${lms}/quizzes`,
    detail: (id: number) => `${lms}/quizzes/${id}`,
    questions: (id: number) => `${lms}/quizzes/${id}/questions`,
    start: (id: number) => `${lms}/quizzes/${id}/start`,
    submit: (id: number) => `${lms}/quizzes/${id}/submit`,
    results: (id: number) => `${lms}/quizzes/${id}/results`,
    // NOT YET IMPLEMENTED: attempts, retake, retakeCount
  },
  assignments: {
    list: `${lms}/assignments`,
    detail: (id: number) => `${lms}/assignments/${id}`,
    submit: (id: number) => `${lms}/assignments/${id}/submit`,
    status: (id: number) => `${lms}/assignments/${id}/status`,
    grade: (id: number) => `${lms}/assignments/${id}/grade`, // instructor only
  },
  enrollments: {
    enroll: (courseId: number) => `${lms}/courses/${courseId}/enroll`, // POST
    me: `${lms}/users/me/enrollments`, // GET
    // NOT YET IMPLEMENTED: delete
  },
  progress: {
    all: `${lms}/users/me/progress`,
    course: (courseId: number) => `${lms}/users/me/courses/${courseId}/progress`,
  },
  reviews: {
    list: `${lms}/reviews`,
    courseReviews: (courseId: number) => `${lms}/courses/${courseId}/reviews`, // GET + POST
    mine: `${lms}/reviews/my-reviews`,
    update: (id: number) => `${lms}/reviews/${id}`,
    delete: (id: number) => `${lms}/reviews/${id}`,
  },
  taxonomy: {
    courseCategories: `${lms}/course-categories`, // NO /taxonomy/ prefix
    tags: `${lms}/tags`,
    levels: `${lms}/levels`,
    // NOT YET IMPLEMENTED: industries
  },
  cart: {
    get: `${lms}/cart`,
    addItem: `${lms}/cart/items`,
    updateItem: (key: string) => `${lms}/cart/items/${key}`,
    removeItem: (key: string) => `${lms}/cart/items/${key}`,
    applyCoupon: `${lms}/cart/coupon`,
    removeCoupon: (code: string) => `${lms}/cart/coupon/${code}`,
    empty: `${lms}/cart`,
  },
  orders: {
    create: `${lms}/orders`,
    list: `${lms}/orders`,
    detail: (id: number) => `${lms}/orders/${id}`,
    items: (id: number) => `${lms}/orders/${id}/items`,
    pay: (id: number) => `${lms}/orders/${id}/pay`,
  },
  payment: {
    methods: `${lms}/payment/methods`,
    intent: `${lms}/payment/intent`,
  },
  bundles: {
    list: `${lms}/bundles`,
    detail: (id: number) => `${lms}/bundles/${id}`,
    featured: `${lms}/bundles/featured`,
  },
  instructors: {
    list: `${lms}/instructors`,
    detail: (id: number) => `${lms}/instructors/${id}`,
    courses: (id: number) => `${lms}/instructors/${id}/courses`,
    reviews: (id: number) => `${lms}/instructors/${id}/reviews`,
  },
  certificates: {
    verify: `${lms}/certificates/verify`,
    legacyVerify: `${swca}/get-certificate`, // fallback
  },
  search: {
    unified: `${lms}/search`,
    suggestions: `${lms}/search/suggestions`,
  },
  media: {
    upload: `${lms}/media`,
    delete: (id: number) => `${lms}/media/${id}`,
  },
  blog: {
    posts: `${wp}/posts`,
    post: (slug: string) => `${wp}/posts?slug=${slug}`,
    pages: `${wp}/pages`,
    categories: `${wp}/categories`,
  },
  // === WHITE-LABEL / MULTI-SITE ===
  settings: {
    get: `${lms}/settings`, // site name, logo, colors, features, contact, social
  },
  memberships: {
    plans: `${lms}/memberships/plans`,
    subscribe: `${lms}/memberships/subscribe`,
    cancel: `${lms}/memberships/cancel`,
    myMembership: `${lms}/users/me/membership`,
  },
  partners: {
    list: `${wp}/partner_logo`, // CPT: trusted-by logos
  },
  testimonials: {
    list: `${wp}/testimonial`, // CPT: customer testimonials
  },
} as const;
```

### 4.3 Response unwrapping

The backend always returns `{ success: true, data: ... }` or, for lists, `{ success: true, data: { items, total, page, per_page, totalPages } }`. Add a single response interceptor that unwraps `success` envelopes; everything downstream sees raw data and can be typed naturally.

`src/lib/api/client.ts` — add to the success handler:

```ts
api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === "object" && "success" in body) {
      if (body.success === true) {
        response.data = body.data;
        return response;
      }
      // success:false comes through as throw
      const err = body.error ?? { code: "unknown", message: "Request failed" };
      return Promise.reject(
        toApiError({
          response: { status: response.status, data: err },
        } as AxiosError),
      );
    }
    return response;
  },
  (error: AxiosError) => {
    /* existing 401/403 logout flow */
  },
);
```

`src/lib/api/parsers.ts` — `paginate()` should accept the `{ items, total, page, per_page, totalPages }` shape and not invent its own from headers, but keep the `X-WP-Total` header fallback for `wp/v2` calls.

### 4.4 Auth Flow (BFF Pattern with httpOnly Cookies)

Tokens are **never stored in client JavaScript**. The BFF (Next.js API routes) manages tokens in httpOnly cookies. This prevents XSS token theft.

#### 4.4.1 BFF Login Route

`src/app/api/auth/login/route.ts`:

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const WP_API = process.env.WP_API_URL!;
const LMS_NS = process.env.LMS_NAMESPACE ?? "lms-backend/v1";

export async function POST(request: Request) {
  const body = await request.json();

  const wpRes = await fetch(`${WP_API}/wp-json/${LMS_NS}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await wpRes.json();

  if (!wpRes.ok || !json.success) {
    return NextResponse.json({ error: json.message ?? "Login failed" }, { status: wpRes.status });
  }

  const { access_token, refresh_token, expires_in, user } = json.data;
  const cookieStore = cookies();

  // httpOnly cookies — NOT accessible to JavaScript
  cookieStore.set("access_token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expires_in,
    path: "/",
  });

  cookieStore.set("refresh_token", refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  // Non-httpOnly cookie for middleware/client auth awareness
  cookieStore.set("user_logged_in", "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expires_in,
    path: "/",
  });

  // Return user data only — no tokens!
  return NextResponse.json({ user });
}
```

#### 4.4.2 BFF Proxy Utility

`src/lib/api/bff.ts`:

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const WP_API = process.env.WP_API_URL!;
const LMS_NS = process.env.LMS_NAMESPACE ?? "lms-backend/v1";

type ProxyOptions = {
  method?: string;
  body?: unknown;
  requiresAuth?: boolean;
};

export async function proxyToWP(wpPath: string, options: ProxyOptions = {}): Promise<NextResponse> {
  const { method = "GET", body, requiresAuth = true } = options;
  const cookieStore = cookies();

  let token = cookieStore.get("access_token")?.value;

  if (requiresAuth && !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(`${WP_API}/wp-json/${LMS_NS}${wpPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // On 401, try refresh once
  if (res.status === 401 && requiresAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${refreshed}`;
      res = await fetch(`${WP_API}/wp-json/${LMS_NS}${wpPath}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    }
  }

  const json = await res.json();

  // Unwrap envelope
  if (json.success === true) {
    return NextResponse.json(json.data, { status: res.status });
  }

  return NextResponse.json(
    { error: json.message ?? "Request failed", code: json.code },
    { status: res.status },
  );
}

async function tryRefresh(): Promise<string | null> {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) return null;

  const res = await fetch(`${WP_API}/wp-json/${LMS_NS}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    // Refresh failed — clear cookies
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    cookieStore.delete("user_logged_in");
    return null;
  }

  const json = await res.json();
  if (!json.success) return null;

  const { access_token, refresh_token, expires_in } = json.data;

  // Update cookies
  cookieStore.set("access_token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expires_in,
    path: "/",
  });

  cookieStore.set("refresh_token", refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return access_token;
}
```

#### 4.4.3 Example Protected Route

`src/app/api/users/me/route.ts`:

```ts
import { proxyToWP } from "@/lib/api/bff";

export async function GET() {
  return proxyToWP("/users/me");
}

export async function PATCH(request: Request) {
  const body = await request.json();
  return proxyToWP("/users/me", { method: "PATCH", body });
}
```

#### 4.4.4 Client-Side Auth Service

`src/lib/services/auth.ts` — calls the BFF, not WordPress directly:

```ts
export const authService = {
  async login(input: { username: string; password: string }) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Login failed");
    }
    return res.json(); // { user }
  },

  async register(input: { username: string; email: string; password: string }) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      credentials: "include",
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  async logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  },

  async me() {
    const res = await fetch("/api/users/me", { credentials: "include" });
    if (!res.ok) throw new Error("Not authenticated");
    return res.json();
  },

  async forgotPassword(email: string) {
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(input: { key: string; login: string; password: string }) {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error((await res.json()).error);
  },
};
```

#### 4.4.5 Auth Store (Simplified)

`src/lib/stores/auth.store.ts` — stores **user only**, not tokens:

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = {
  id: number;
  username: string;
  email: string;
  display_name: string;
  roles: string[];
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "auth-storage" },
  ),
);
```

#### 4.4.6 Middleware (Updated)

`src/middleware.ts` — checks `user_logged_in` cookie:

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/learn", "/profile", "/orders", "/certificates"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const loggedIn = request.cookies.get("user_logged_in")?.value;

    if (!loggedIn) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learn/:path*",
    "/profile/:path*",
    "/orders/:path*",
    "/certificates/:path*",
  ],
};
```

**Key security improvements:**

- Tokens never touch client JavaScript (XSS-immune)
- Automatic token refresh handled server-side
- Single point for auth logic (BFF)
- Middleware uses a lightweight awareness cookie, not the actual token

### 4.5 Lessons → Units

The existing `src/lib/services/lessons.ts`, `src/lib/hooks/useLessons.ts`, `src/components/lessons/lesson-player.tsx`, and the `/learn/[courseId]/[lessonId]` route all need renaming to `units` / `unitId`. The user-facing copy can still say "Lesson" — but the URL and internal identifier must follow the backend or you get the next dev confused inside a week. Pick one. I pick `unit` because it's what the backend says.

Migration: keep `/learn/[courseId]/[lessonId]/page.tsx` as a redirect to `/learn/[courseId]/[unitId]/page.tsx` for one release.

---

## 5. Backend Gap Matrix vs Live Site Features

This is the **honest** view. Anything in the right column blocks a live-site-parity feature. Cross-reference §11–§19 of `LMS_API_PLAN.md`.

| Live site feature                   | Required backend                                    | Status                   | Workaround / decision                                                                                                     |
| ----------------------------------- | --------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Hero search                         | `GET /search/suggestions`                           | ❌ Not built             | Phase 2: client-side `/courses/search` debounced; swap when ready                                                         |
| Featured course grid                | `GET /courses/featured`                             | ✅                       | —                                                                                                                         |
| Popular course grid                 | `GET /courses/popular`                              | ✅                       | —                                                                                                                         |
| Course card price (RRP slashed)     | `price` + `regular_price` on Course                 | 🔧 Needs WC product join | Backend ticket: include `_regular_price`/`_sale_price` from linked WC product                                             |
| "Modules", duration, students count | course detail meta                                  | 🔧 Partial               | Add `lessons_count`, `duration_seconds`, `students_count` to `/courses` list response (`Course_Model::to_array_for_list`) |
| Categories grid                     | `GET /taxonomy/course-categories`                   | ✅                       | —                                                                                                                         |
| Membership / Premium plan           | WC Subscriptions wrapper                            | ❌                       | **P0 blocker.** New `MembershipsController` wrapping `WC_Subscriptions`                                                   |
| Business plan request               | Contact form                                        | N/A                      | Build as Next route handler → email/HubSpot/CRM                                                                           |
| Trusted-by logo strip               | Static or CMS-driven                                | N/A                      | ACF or hard-coded in V1; CMS in V2                                                                                        |
| Testimonials                        | Custom CPT or `/wp/v2/posts?categories=testimonial` | ❌                       | Backend ticket: `wp/v2/testimonial` CPT, or a `GET /lms-backend/v1/testimonials`                                          |
| Pricing comparison table            | Static config                                       | N/A                      | Hard-code the three plans, render from a typed config object                                                              |
| Cart, Checkout, Order Received      | §11 in API plan                                     | ❌                       | **P0 blocker.** Build before any paid course can launch                                                                   |
| Stripe payment                      | `POST /payment/intent`                              | ❌                       | Same as above                                                                                                             |
| Newsletter                          | None                                                | N/A                      | Next route handler → Mailchimp/Brevo                                                                                      |
| Blog                                | `wp/v2/posts`                                       | ✅ native                | Use directly; CDN-rewrite via backend `MediaFilter`                                                                       |
| Auto-enrol after purchase           | `woocommerce_order_status_completed` hook           | ❌                       | Wire in `Routes::register()` per §11                                                                                      |
| Certificates download               | `GET /courses/{id}/certificate`                     | ❌                       | Fallback to `swca/v1/get-certificate` until built                                                                         |
| Certificate verification page       | `GET /certificates/verify?code=`                    | ❌                       | Public `/certificates/verify` page on frontend, blocked until endpoint ships                                              |
| Reviews on course page              | `GET /courses/{id}/reviews`                         | ✅                       | —                                                                                                                         |
| Submit review                       | `POST /courses/{id}/reviews`                        | ✅                       | —                                                                                                                         |
| Quiz inside lesson                  | `GET /units/{id}/quiz` + submit                     | ✅                       | —                                                                                                                         |
| Assignments                         | `POST /assignments/{id}/submit`                     | ✅                       | —                                                                                                                         |
| Notifications bell                  | `GET /users/me/notifications`                       | ❌                       | Hide UI in V1 if not shipped; toggle by feature flag                                                                      |
| Avatar upload                       | `POST /users/me/avatar`                             | ❌                       | Read-only avatar from `display_name` initial in V1                                                                        |
| Instructor pages                    | `GET /instructors*`                                 | ❌                       | Defer; link to course → instructor section instead                                                                        |
| Bundle pages                        | `GET /bundles*`                                     | ❌                       | Defer or fake with WC `course_bundle` product type via direct WP query (not recommended)                                  |

**Decision matrix outcome:** the frontend can launch a marketing-only V1 against today's backend. **Paid course flow + memberships require backend P0 work in parallel.** Track those tickets in `LMS_API_PLAN.md` §11 and §12.

---

## 6. Phased Rollout

Phases run in parallel with the backend P0 work. Each phase ends in a deploy.

### Phase 0 — API alignment + BFF scaffolding (1 sprint, blocks all others)

**Architecture (BFF Pattern):**

- **Implement BFF proxy routes** (`src/app/api/`) for all authenticated operations (§3.1-3.5):
  - `/api/auth/*` — login, register, logout, forgot-password, reset-password
  - `/api/users/me/*` — profile, progress, enrollments
  - `/api/courses/[id]/*` — enroll, reviews (POST)
  - `/api/units/[id]/*` — content, complete
  - `/api/quizzes/[id]/*` — questions, start, submit, results
  - `/api/assignments/[id]/*` — detail, submit, status
- **Implement `src/lib/api/bff.ts`** — `proxyToWP()` utility with auto token refresh (§4.4.2)
- **Use httpOnly cookies for tokens** — never expose to client JS (§4.4.1)
- Update **middleware** to use `user_logged_in` cookie (§4.4.6)

**API Alignment:**

- Update `endpoints.ts` to `lms-backend/v1` namespace (§4.2)
- Update `env.ts` default + `.env.example` with white-label env vars (§4.1, §1b)
- Add response-unwrap interceptor to axios (§4.3) — used only for RSC direct calls
- Rewrite `auth.ts` service to call `/api/auth/*` (§4.4.4)
- Rename `lessons` → `units` everywhere (§4.5)

**Services & Providers:**

- **Add `settings.ts` service + `SiteSettingsProvider`** — fetch `/settings`, inject CSS variables, provide feature flags context (§1b)
- Add `src/lib/api/server.ts` for RSC-side fetching using native `fetch` with `next: { revalidate, tags }` — do **not** use axios in server components
- Replace `paginate()` to consume the API's `{ items, total, page, per_page, totalPages }` envelope

**Tooling:**

- Wire Sentry, add `instrumentation.ts`
- Add Vitest + Playwright config; one smoke test per layer
- Add `next-intl` with `/[locale]/...` routing (§13 PR #6)
- No CORS config needed — BFF eliminates cross-origin issues for auth'd routes

**Done when:** `npm run dev`, login sets httpOnly cookie, `/api/users/me` returns profile, `/courses` lists real courses via RSC, `/courses/[slug]` renders curriculum, site name/logo/colors load from `/settings` or env fallback.

### Phase 1 — Marketing site V1 (2 sprints)

- Home: Hero (with search), Featured grid, Popular grid, Categories grid, Pricing teaser, Testimonials, TrustedBy, Newsletter, FAQ
- `/courses` with filters (category, level, price, sort) + pagination + skeletons
- `/courses/[slug]` with hero, sticky enroll/buy card, curriculum, reviews, instructor card, related courses
- `/categories`, `/categories/[slug]`
- `/blog`, `/blog/[slug]` via `wp/v2/posts`
- `/about`, `/contact` (form → Next route handler), `/terms`, `/privacy`
- `/pricing` fetches plans from `GET /memberships/plans` (WC Subscriptions wrapper). Fallback: show "Contact us" CTA if endpoint unavailable. **Never hardcode plan names/prices.**
- `/search` with debounced query against `/courses/search`
- SEO: `metadata` per route, `sitemap.ts`, `robots.ts`, JSON-LD for `Course`, `Organization`, `Review`, `BreadcrumbList`
- ISR: home `revalidate: 300`, course detail `revalidate: 600`, blog `revalidate: 300`
- On-demand revalidation route `/api/revalidate?secret=…&tag=…` (call from WP `save_post_course` hook later)
- Light/dark theme, accessible header/footer, mobile nav
- Analytics: GA4 + Vercel Analytics (no consent banner in V1 per product decision)

**Done when:** Lighthouse ≥ 90 (mobile, throttled) on home and course detail; all marketing pages render with real data; sitemap covers all course slugs.

### Phase 2 — Auth + Student dashboard (1.5 sprints)

- Login, Register, Forgot, Reset (real reset-password flow now uses backend, not WP redirect)
- Dashboard layout + sidebar
- `/dashboard` summary cards (enrolled, in-progress, completed, certificates count)
- `/dashboard/courses` enrolled with progress
- `/dashboard/profile` view + edit (`PUT /users/me`)
- `/dashboard/orders`, `/dashboard/orders/[id]`
- `/dashboard/certificates` (list + download)
- `/dashboard/notifications` (gated by feature flag until endpoint ships)
- `/learn/[courseId]/[unitId]` full-screen player: video, HTML, attachments, mark-complete, prev/next, sidebar curriculum, quiz embed, assignment submit
- Quiz attempt flow (start → answer → submit → result with retake count)
- Assignment submission flow (file upload via `multipart/form-data`)
- Reviews: write/edit/delete on enrolled courses
- Optimistic mutations on enroll, complete unit, review CRUD
- `useAuthBootstrap()` runs `authService.me()` on mount; if 401 and refresh token present, refresh

**Done when:** A real student can log in, enrol in a free course, complete a unit, submit a quiz and assignment, leave a review, and download a certificate (if backend ships it; otherwise show "Coming soon" with the user's earned-courses count).

### Phase 3 — Commerce (2 sprints, **gated by backend P0**)

Only starts after backend §11 cart/checkout/orders endpoints are merged.

- `/cart` with line items, quantity, remove, coupon
- Persistent cart: server-side via `Cart-Token` (header `X-WC-Cart-Token` returned from backend) stored in `cart.store.ts`; for guests, store cart token only
- `/checkout` with billing/shipping form (RHF + zod), payment method selector, totals, Stripe Elements for card
- `POST /orders` → `POST /payment/intent` → confirm with Stripe.js → success → `/order/[id]/received`
- `/order/[id]/received` order summary, "Start learning" CTA wired to first unit of each enrolled course
- Membership purchase flow (WC Subscriptions wrapper) — same checkout, different gateway flow
- Auto-enrol verified end-to-end (smoke test: order → paid → user appears in course's enrollments list)
- Tax/VAT lines surfaced from WC totals
- Order email handled by WC; we just confirm the redirect lands

**Done when:** A test user can pay for a £29 course in Stripe test mode and access it within 30s of the receipt page loading.

### Phase 4 — Bundles, Instructors, Search v2, Notifications (1 sprint)

Gated per-feature on backend availability:

- `/bundles`, `/bundles/[slug]`
- `/instructors/[slug]` with course list
- `/search` upgraded to unified `/search` endpoint with type filters
- Hero search wired to `/search/suggestions`
- Notifications bell in header polling `/users/me/notifications` every 60s
- Badges page

### Phase 5 — Hardening (ongoing)

- Move auth to BFF (Next route handlers in `src/app/api/auth/*`); set `HttpOnly` `Secure` `SameSite=Strict` cookies; remove `localStorage` token; replace axios JWT injection with cookie-forwarding fetcher; rotate refresh server-side
- A/B test header CTA, hero copy
- 1% Sentry replay on errors
- WebVitals → analytics
- E2E coverage ≥ 60% of student happy paths in Playwright

---

## 7. SEO + Performance Rules

This is a content site. Treat it like one.

- **Always `next/image` for course thumbnails.** Sized, with `sizes`, and `priority` only on the LCP image (hero or first card above the fold).
- **Server-render structured data on every public page.** Helpers in `src/lib/seo/jsonld.ts`:
  - Home + about → `Organization`
  - Course detail → `Course` + `BreadcrumbList` + `AggregateRating` (only if `ratingCount > 0`)
  - Blog single → `BlogPosting`
- **`metadata` export on every page**, no client-side `<Head>`. OG image generated via `app/opengraph-image.tsx` template per route.
- **ISR + tag-based on-demand revalidation.** Hook into the backend with a small WP plugin snippet:
  ```php
  add_action('save_post_course', function ($post_id) {
      wp_remote_post(getenv('FRONTEND_REVALIDATE_URL'), [
          'body' => json_encode(['secret' => getenv('WP_REVALIDATE_SECRET'), 'tag' => 'course:' . $post_id]),
          'headers' => ['Content-Type' => 'application/json'],
      ]);
  });
  ```
  Frontend `/api/revalidate` calls `revalidateTag('course:' + id)` and the matching list tags.
- **Tag every server fetch** with stable tags so revalidation is precise:
  ```ts
  await fetch(url, { next: { revalidate: 600, tags: [`course:${id}`, "courses:list"] } });
  ```
- **Defer all third-party scripts** (Hotjar, GA4) with `<Script strategy="afterInteractive" />` and only after consent.
- **Edge runtime** for `/api/revalidate` and `/api/newsletter`. Node runtime for anything that touches the WP API behind auth.
- **No client-side data fetching above the fold** on marketing pages — every render that's not user-specific is RSC.
- Lighthouse budgets enforced in CI:
  - Performance ≥ 90 (mobile)
  - LCP ≤ 2.5s
  - CLS ≤ 0.1
  - JS shipped to home ≤ 180kb gzipped

---

## 8. Security — non-negotiable

| Concern                | Rule                                                                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XSS via WP HTML        | `dompurify` (server) before rendering any `course.content` / unit HTML / blog post HTML. Never `dangerouslySetInnerHTML` raw API content.                                                                        |
| JWT storage            | V1: `localStorage` + non-HttpOnly cookie for middleware. V2: HttpOnly cookie via BFF. **Document the trade-off in PR description.**                                                                              |
| Refresh token          | Same store as access token in V1; never log it; never include it in URL params; rotate on every refresh (backend already does SHA-256-stored rotation).                                                          |
| CSRF                   | Until BFF: every mutation goes through axios with `Authorization` header — no cookie auth means no CSRF surface. Once BFF is on, add a `X-CSRF-Token` header backed by a per-session token in a separate cookie. |
| File uploads           | Server-side MIME check on the WP side (already enforced). Client only restricts UI via `accept=` and validates size before upload.                                                                               |
| Stripe                 | Publishable key in `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Secret key never appears in this repo. PaymentIntent created server-side by WP.                                                                         |
| CORS                   | Backend `LMS_BACKEND_API_ALLOWED_ORIGINS` lists exact deploy origins; wildcard never.                                                                                                                            |
| Rate-limited endpoints | Reflect the backend's transient-based rate limiting (register, password reset, coupon) in the UI: disable submit + countdown after 5 attempts.                                                                   |
| Dependency CVEs        | `npm audit --omit=dev` in CI; weekly Dependabot.                                                                                                                                                                 |
| Secrets in repo        | None. `.env.local` git-ignored (already is). Vercel env vars managed in dashboard.                                                                                                                               |
| Newsletter route       | Validate input with zod, rate-limit by IP (in-memory LRU on edge), never echo upstream API errors to the client.                                                                                                 |
| Open redirects         | `next` query param on `/login` whitelisted to internal paths only — `if (!next.startsWith('/')) next = '/dashboard'`.                                                                                            |

---

## 9. Testing Strategy

| Layer                          | Tool                                               | Coverage target                                         |
| ------------------------------ | -------------------------------------------------- | ------------------------------------------------------- |
| Unit (utils, parsers, schemas) | Vitest                                             | 80% lines                                               |
| Service (mocked HTTP)          | Vitest + MSW                                       | Every service function happy + error                    |
| Hook                           | RTL + Vitest                                       | Every hook with success/error/loading states            |
| Component                      | RTL                                                | Smoke render for all UI primitives + auth forms         |
| Integration                    | Playwright (against staging WP)                    | Login → enrol → complete unit → review                  |
| E2E commerce                   | Playwright (against staging WP + Stripe test mode) | Add to cart → checkout → order received → access course |

CI gate (GitHub Actions): typecheck → lint → unit → build. Playwright on a separate workflow nightly + on `main`.

---

## 10. Developer Experience

- `npm run dev` works against `http://lms-site.test` (the user's local Valet/Sites install). Add hosts entry if needed.
- MSW dev override: set `NEXT_PUBLIC_USE_MOCKS=1` to run the frontend against in-process mocks so frontend devs aren't blocked by backend P0 work.
- Storybook (optional, Phase 2): catalog UI primitives + course card variants for design review.
- Conventional commits enforced via Husky `commit-msg` (add `commitlint`).
- PR template: linked Figma frame, screenshot before/after, Lighthouse delta if marketing page.

---

## 11. Risks & Mitigations

| Risk                                          | Likelihood | Impact | Mitigation                                                                                                                                     |
| --------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend §11 (cart/checkout) slips             | High       | High   | Build Phase 3 against MSW with the documented contract from `LMS_API_PLAN.md` so frontend is ready the day backend merges                      |
| WC Subscriptions wrapper delayed              | Medium     | High   | **Confirmed: using WC Subscriptions.** Backend ticket filed. If API not ready by Phase 3, membership plans show "Contact us" CTA as fallback.  |
| Token refresh race conditions                 | Medium     | High   | Single in-flight `refreshPromise` (§4.4), retry once, hard-logout on second 401                                                                |
| WP HTML breaks the layout                     | High       | Medium | Sanitize + render in a constrained `prose` container; CSS-isolate with `:where` selectors                                                      |
| Image hosts blocked by `next/image`           | Medium     | Medium | `next.config.mjs` `remotePatterns` already covers WP host, gravatar, wp.com; add CDN host when set                                             |
| SEO regression vs current site                | High       | High   | Crawl current site sitemap, build a 301-map from old URLs to new in `next.config.mjs` `redirects()` before launch                              |
| Cart token vs JWT collision                   | Medium     | Medium | Two distinct stores; never put `Cart-Token` in `Authorization` header                                                                          |
| Free-course enrol used to bypass paid courses | Low        | High   | Backend already gates on `wplms_course_price == 0` for `POST /users/me/enrollments`; do **not** add an "enrol" CTA on paid courses, only "Buy" |

---

## 12. Product Decisions (resolved) + Open Questions

### Resolved

| #   | Question                                | Decision                                                                        | Action                                                                                                                                                                                      |
| --- | --------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Memberships (Monthly £29 / Premium £79) | **WC Subscriptions**                                                            | Backend ticket: wrap WC Subscriptions in `/lms-backend/v1/memberships` (list plans, subscribe, cancel, status). Frontend: `/pricing` page calls this API.                                   |
| 2   | URL slug structure                      | **Mirror current site exactly** (e.g. `/courses/microsoft-excel-course-online`) | No 301 map needed at launch — slugs match. Confirm WP `post_name` values align before go-live.                                                                                              |
| 3   | "Trusted by" logo strip                 | **CMS-driven**                                                                  | Backend ticket: register `partner_logo` CPT with `title`, `logo` (attachment), `url`. Frontend: fetch via `wp/v2/partner_logo` or a thin `/lms-backend/v1/partners` wrapper.                |
| 4   | Testimonials                            | **Maintain in WP** (Trustpilot pull deferred)                                   | Backend ticket: register `testimonial` CPT with `content`, `author_name`, `author_role`, `avatar`, `rating`. Frontend: fetch via `wp/v2/testimonial`.                                       |
| 5   | Cookie-consent compliance               | **Not required for V1**                                                         | Skip consent banner. GA4 + Vercel Analytics load unconditionally. Revisit if UK ICO requirements tighten or business enters EU market.                                                      |
| 7   | Languages                               | **English only at launch**, but structure routes for future i18n                | Adopt `next-intl` now with `/[locale]/...` routing. Ship with `en` as only supported locale. Config: `locales: ['en'], defaultLocale: 'en'`. Zero user-facing impact, easy expansion later. |

### Still Open (need answers before Phase 1 kickoff)

| #   | Question                                                       | Who owns the answer? |
| --- | -------------------------------------------------------------- | -------------------- |
| 6   | Search-without-results page copy/CTA                           | Marketing            |
| 8   | Business plan leads destination (HubSpot / Salesforce / email) | Product / Sales      |

Once #6 and #8 are answered, update this section and unblock the `/search` empty-state component and `/contact` route handler implementation.

---

## 13. Concrete First-Sprint Backlog (Phase 0)

Each item is a PR. Order matters.

### Foundation (PRs 1-4)

1. `chore: align LMS namespace to lms-backend/v1` — `env.ts`, `.env.example`, README env table
2. `feat(api): rebuild endpoints map for lms-backend/v1` — `endpoints.ts` per §4.2
3. `feat(api): add response-unwrap interceptor + paginate envelope` — `client.ts`, `parsers.ts`, tests
4. `refactor: rename lessons → units` — services/hooks/components/routes (with redirect for one release)

### BFF Proxy Layer (PRs 5-7) — CRITICAL FOR SECURITY

5. `feat(bff): add proxy utility with auto-refresh` — `src/lib/api/bff.ts` per §4.4.2
   - `proxyToWP()` function reads httpOnly cookies
   - Auto-refreshes on 401, retries once
   - Unwraps `{ success, data }` envelope
   - Sets/updates cookies on refresh

6. `feat(bff): implement auth routes` — `src/app/api/auth/*`
   - `POST /api/auth/login` — validates with WP, sets httpOnly cookies
   - `POST /api/auth/register` — same pattern
   - `POST /api/auth/logout` — calls WP, clears cookies
   - `POST /api/auth/forgot-password`
   - `POST /api/auth/reset-password`

7. `feat(bff): implement user + learning routes` — `src/app/api/users/*`, `src/app/api/units/*`, `src/app/api/quizzes/*`
   - `GET/PATCH /api/users/me`
   - `GET /api/users/me/progress`
   - `GET /api/users/me/enrollments`
   - `POST /api/courses/[id]/enroll`
   - `GET /api/units/[id]/content`
   - `POST /api/units/[id]/complete`
   - `GET/POST /api/quizzes/[id]/*`

### Client Updates (PRs 8-10)

8. `refactor(auth): switch auth service to BFF + simplify store` — per §4.4.4, §4.4.5
   - `services/auth.ts` calls `/api/auth/*` not WP directly
   - `stores/auth.store.ts` stores `user` only, not tokens
   - Update `useAuth` hook and login/register forms
   - Update `middleware.ts` to check `user_logged_in` cookie

9. `feat(api): add server-only fetcher for RSC` — `lib/api/server.ts`
   - For public data (courses, categories, blog) fetched in Server Components
   - Uses native `fetch` with `next: { revalidate, tags }`
   - Does NOT use axios

10. `feat(settings): add site settings service + provider` — per §1b
    - `services/settings.ts`, `hooks/useSettings.ts`
    - `SiteSettingsProvider` context
    - CSS variable injection for theming
    - Feature flag checks
    - Fallback to env vars if endpoint unavailable

### Tooling & i18n (PRs 11-14)

11. `feat(i18n): add next-intl with /[locale]/... routing`
    - Install `next-intl`, wrap app in `NextIntlClientProvider`
    - Move route groups under `app/[locale]/`
    - Config: `locales: ['en'], defaultLocale: 'en'`

12. `chore(seo): add sitemap.ts + robots.ts skeletons` — read site name from settings

13. `chore(monitoring): wire Sentry + instrumentation.ts`

14. `chore(test): vitest config + Playwright login smoke`
    - 1 BFF route unit test (mock WP response)
    - 1 component test (auth form)
    - E2E: login → dashboard → logout flow

15. `docs: update README with BFF architecture, env vars, security model`

**After PR #15 lands, Phase 1 is unblocked.**

### Backend Tickets to File Now

These block Phase 1 / Phase 3 — file them immediately:

| Ticket                    | Blocks                         | Description                                                                                                                                                                                   |
| ------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Settings_Controller`** | **Phase 0 (white-label)**      | `GET /lms-backend/v1/settings` — site name, logo URLs, colors, contact info, social links, currency, locale, feature flags. See §1b for full schema. **Critical for multi-site reusability.** |
| `partner_logo` CPT        | Phase 1 (TrustedBy section)    | Register CPT with `title`, `logo` (attachment ID), `url`. Expose via `wp/v2/partner_logo` or `/lms-backend/v1/partners`.                                                                      |
| `testimonial` CPT         | Phase 1 (Testimonials section) | Register CPT with `content`, `author_name`, `author_role`, `avatar`, `rating` (1-5). Expose via `wp/v2/testimonial`.                                                                          |
| WC Subscriptions wrapper  | Phase 3 (Memberships)          | `GET /memberships/plans`, `POST /memberships/subscribe`, `POST /memberships/cancel`, `GET /users/me/membership`. See §12 in `LMS_API_PLAN.md` for WC function calls.                          |
| Cart/Checkout/Orders      | Phase 3 (Commerce)             | §11 in `LMS_API_PLAN.md` — full cart, order, and payment endpoints.                                                                                                                           |

---

## 14. Reference Map

- **API Reference (extracted from source):** `./API_REFERENCE.md` — **authoritative, verified against actual plugin code**
- API planning document: `<plugin-root>/LMS_API_PLAN.md`
- Frontend usage examples: `<plugin-root>/FRONTEND_REST_API_GUIDE.md`
- Plugin entry: `<plugin-root>/lms-backend-rest-api.php`
- Routes: `<plugin-root>/includes/Routes.php`
- Controllers: `<plugin-root>/includes/Api/Controllers/`
- Models: `<plugin-root>/includes/Api/Models/`

> **Note:** `<plugin-root>` refers to your local WordPress installation at `wp-content/plugins/lms-backend-rest-api/`. Clone from <https://github.com/Codezen-technology/wp-lms-backend-rest-api>.

- Live site to replicate: <https://trainingexcellence.org.uk/>
- WPLMS function reference: §"WPLMS Function Reference" in `LMS_API_PLAN.md`
- Certificate plugin (legacy fallback): `wp-content/plugins/wplms-certificate-automation-aws-support`

---

## 15. Definition of Done — Launch

- All P0 + P1 + P2 + P3 phases shipped to production
- Lighthouse mobile scores: Perf ≥ 90, A11y ≥ 95, SEO 100, Best Practices ≥ 95 on home, courses list, course detail
- E2E green: register → login → enrol free → complete unit → submit quiz → submit review
- E2E green: register → login → buy paid course (Stripe test) → access course
- 301 redirects from current WP site URLs to new routes
- Sitemap submitted to Google Search Console; old site `301`s preserve indexed URLs
- Backups: WP DB nightly; Sentry alerting hooked to PagerDuty/Slack
- Runbook documented: token expiry incident, cart-token leak, Stripe webhook failure
- Pen test sign-off on auth + checkout flows

— end —
