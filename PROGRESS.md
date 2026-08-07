# Project progress

Tracks delivery against [PROJECT_PLAN.md](./PROJECT_PLAN.md) and [API_REFERENCE.md](./API_REFERENCE.md).

**How to use:** Update checkboxes as work lands. Add a dated line under **Log** when you merge a PR or change scope.

---

## Snapshot

| Field             | Value                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| **Current phase** | Phase 1 — Marketing site V1                                                                                    |
| **Last updated**  | 2026-05-11                                                                                                     |
| **Hard blockers** | `Settings_Controller` `GET /lms-backend/v1/settings` — without this, site branding falls back to env vars only |
| **Soft blockers** | `partner_logo` CPT, `testimonial` CPT — these sections render empty on home page until backend ships           |

---

## Phases

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

### Phase 0 — API alignment + BFF scaffolding ✅ COMPLETE

All 15 PRs landed. Full list in **Phase 0 — PR backlog** below.

---

### Phase 1 — Marketing site V1 _(current)_

Phase 1 is split into sprints by dependency order. Build the ones with no blockers first.

#### Sprint 1.1 — Course catalog (no backend blockers)

These use `serverApi` which already works. Ship these first.

- [ ] `CourseCard` component — `next/image` with `sizes`, price badge, rating stars, instructor line
- [ ] `/courses` list page — RSC, `serverApi.courses.list()`, filter bar (category, level, price), pagination, empty state
- [ ] `/courses/[slug]` detail page — hero, curriculum accordion (units list), instructor card, reviews strip, sticky enroll sidebar
- [ ] `generateStaticParams` for course slugs (ISR at 10 min) + `generateMetadata` (OG, JSON-LD Course schema)
- [ ] `/course-categories/[slug]` — filtered course list by category
- [ ] Revalidate webhook — `POST /api/revalidate?secret=X&tag=course:slug` calls `revalidateTag()`

#### Sprint 1.2 — Home page (available sections)

- [ ] Hero — full-bleed image/video, headline from settings or fallback copy, two CTAs
- [ ] Featured + popular courses grid (RSC `serverApi.courses.featured()` + `serverApi.courses.popular()`)
- [ ] Category strip — `serverApi.taxonomy.categories()`, icon per category
- [ ] Blog preview — 3 latest posts via `serverApi.blog.posts({ per_page: 3 })`, RSC
- [ ] Newsletter subscribe — Client Component, `POST /api/newsletter`, success/error states
- [ ] Stats bar — 4 numbers (courses, students, instructors, countries); read from settings or hardcode until `Settings_Controller` ships

#### Sprint 1.3 — Home page (blocked sections)

Do not fake these with hardcoded data. Render nothing or a layout placeholder until the backend tickets are done.

- [ ] Partner logos — blocked on `partner_logo` CPT + REST (`/wp/v2/partner_logo`)
- [ ] Testimonials carousel — blocked on `testimonial` CPT + REST (`/wp/v2/testimonial`)
- [ ] Pricing teaser — blocked on WC Subscriptions wrapper (`/memberships/*`)

#### Sprint 1.4 — Supporting pages

- [ ] `/blog` listing (RSC, pagination, featured post hero)
- [ ] `/blog/[slug]` — full post, `generateMetadata`, JSON-LD Article schema
- [ ] `/contact` — static form, `POST /api/contact`, honeypot field, rate-limit in route handler
- [ ] `/about` — static content, pulled from WP page API if available
- [ ] `/faq` — accordion, sourced from WP FAQ CPT or hardcoded
- [ ] `/pricing` — plan cards; fallback to hardcoded until subscriptions API lands

#### Sprint 1.5 — SEO + performance (do before launch, not after)

These are not optional. Skipping them means a reindex after launch.

- [ ] `generateMetadata` on every page (title, description, canonical, OG, Twitter card)
- [ ] JSON-LD on `/courses/[slug]` (Course), `/blog/[slug]` (Article), `/` (Organization)
- [ ] `next/image` `sizes` audit — every image in the codebase, check `sizes` is correct for its layout slot
- [ ] Verify `sitemap.ts` returns all course + blog slugs; add `/categories/*` entries
- [ ] Lighthouse CI baseline — target LCP < 2.5 s, CLS < 0.1, TBT < 200 ms on mobile

---

### Phase 2 — Auth + student dashboard

Auth pages are already wired to BFF (Phase 0). What's left is the UI.

- [ ] Login page UI — form, error states, redirect-after-login (`?next=` param)
- [ ] Register page UI — name + email + password, T&C checkbox
- [ ] Forgot-password + reset-password pages (routes exist, need polished UI)
- [ ] Dashboard — enrolled courses, progress rings, resume last unit CTA
- [ ] Profile — edit name/avatar/bio, change password, delete account
- [ ] Certificates + badges listing pages
- [ ] Orders history page

### Phase 3 — Commerce

Blocked on backend tickets for cart, checkout, WC Subscriptions.

- [ ] Cart drawer — `POST /api/cart`
- [ ] Checkout flow — Stripe Elements, order creation, WC order status webhook
- [ ] Membership purchase → auto-enroll
- [ ] Orders detail page

### Phase 4 — Bundles, instructors, search v2, notifications

- [ ] Per backend availability

### Phase 5 — Hardening

- [ ] Auth: token rotation test, CSRF review
- [ ] Sentry: adjust sample rates for production traffic volume
- [ ] Web Vitals: RUM integration, field data feedback loop
- [ ] E2E coverage: critical paths (enroll, checkout, complete unit, cert download)

---

## Known tech debt (fix before Phase 2, not Phase 3)

These are real problems, not nice-to-haves.

| #    | Issue                                                                                                          | Impact                                                                 | Fix                                                                        |
| ---- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| TD-1 | `fetchSettings()` called twice per render (in `generateMetadata` and `RootLayout`)                             | Extra round-trip to WP on every cold render                            | Memoize with `React.cache()` in `settings.server.ts`                       |
| TD-2 | `serverApi` returns `unknown` everywhere                                                                       | No type safety on RSC data — casting is silent runtime bomb            | Replace `unknown` with proper types as each page is built                  |
| TD-3 | `hexToHslChannels()` has no unit test                                                                          | Colour override silently broken if input format changes                | Add tests to `color.test.ts`                                               |
| TD-4 | `proxyToWP` refreshes token on 401 but doesn't propagate the new cookie to the response in a streaming context | Will fail when streaming RSC added                                     | Add `Set-Cookie` forwarding to refresh path                                |
| TD-5 | No request correlation ID in BFF                                                                               | Impossible to trace a specific user request across Next.js and WP logs | Add `X-Request-Id` header via middleware, pass through `proxyToWP`         |
| TD-6 | Vitest coverage near zero                                                                                      | Regressions invisible                                                  | Target 60% coverage on `lib/` utilities and services before Phase 2 launch |

---

## Phase 0 — PR backlog (complete)

### Foundation

- [x] **PR1** — `chore: align LMS namespace` — `env.ts`, `.env.example`, README
- [x] **PR2** — `feat(api): rebuild endpoints map` — `endpoints.ts`
- [x] **PR3** — `feat(api): unwrap + paginate envelope` — `client.ts`, `parsers.ts`
- [x] **PR4** — `refactor: lessons → units`

### BFF

- [x] **PR5** — `feat(bff): proxy utility` — `src/lib/api/bff.ts`
- [x] **PR6** — `feat(bff): auth routes` — `src/app/api/auth/*` (login, register, logout, forgot-password, reset-password)
- [x] **PR7** — `feat(bff): user + learning routes` — users, enrollments, progress, enroll, units, quizzes, assignments, reviews

### Client + server

- [x] **PR8** — `refactor(auth): BFF + store + middleware`
- [x] **PR9** — `feat(api): server fetcher` — `lib/api/server.ts`
- [x] **PR10** — `feat(settings): service + provider`

### Tooling

- [x] **PR11** — `feat(i18n): next-intl` + `[locale]` routes
- [x] **PR12** — `chore(seo): sitemap + robots`
- [x] **PR13** — `chore(monitoring): Sentry`
- [x] **PR14** — `chore(test): Vitest + Playwright smoke`
- [x] **PR15** — `docs: README`

---

## Backend tickets (cross-team)

| Ticket                                                 | Blocks                                  | Status |
| ------------------------------------------------------ | --------------------------------------- | ------ |
| `Settings_Controller` — `GET /lms-backend/v1/settings` | Site branding, stats bar, feature flags | [ ]    |
| `partner_logo` CPT + REST                              | Home page partners section              | [ ]    |
| `testimonial` CPT + REST                               | Home page testimonials section          | [ ]    |
| WC Subscriptions wrapper (`/memberships/*`)            | Pricing page, membership purchase       | [ ]    |
| Cart / checkout / orders endpoints                     | All of Phase 3                          | [ ]    |

## Product open questions

| #   | Topic                                                  | Owner         | Status |
| --- | ------------------------------------------------------ | ------------- | ------ |
| 6   | Search empty-state copy / CTA                          | Marketing     | Open   |
| 8   | Business plan leads destination (HubSpot / SF / email) | Product/Sales | Open   |

---

## Definition of done (launch checklist)

See **§15** in [PROJECT_PLAN.md](./PROJECT_PLAN.md). Summary:

- Lighthouse mobile scores: Performance ≥ 90, SEO = 100, Accessibility ≥ 95
- All E2E critical paths green
- `robots.txt` verified; sitemap submitted to GSC
- Runbook exists for on-call (revalidation, token revoke, Sentry triage)
- Security: pen test or at minimum OWASP Top 10 self-review done

---

## Log

Newest first.

| Date       | Note                                                                                                                                                                                                                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-11 | Bug fixes: `hexToHslChannels` utility for correct shadcn CSS var injection (hex → HSL channels); removed duplicate CSS var injection from `SiteSettingsProvider`; removed redundant `url.search` assignment in middleware; `serverApi` now uses `env.LMS_NAMESPACE` instead of hardcoded string. Typecheck: ✅                           |
| 2026-05-11 | **Phase 0 complete.** All 15 PRs landed: BFF proxy + all auth/user/quiz/assignment/review routes, httpOnly auth cookies, settings service + SiteSettingsProvider, server.ts RSC fetcher, next-intl `[locale]` routing, sitemap + robots, Sentry, Vitest + Playwright smoke, README. Build: ✅ 22 pages, 0 errors. **Phase 1 unblocked.** |
| 2026-05-11 | Phase 0 core: `lms-backend/v1` endpoints, axios LMS envelope unwrap, BFF, httpOnly auth cookies, lessons→units.                                                                                                                                                                                                                          |
