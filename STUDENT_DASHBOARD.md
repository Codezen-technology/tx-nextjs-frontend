# Student Dashboard — Headless Implementation Guide

> **Reference implementation:** `student-dashboard` WordPress plugin — `src/front-end/`
> **API backend:** `wp-lms-backend-rest-api` plugin — namespace `lms-backend/v1`
> **Auth:** JWT via `Authorization: Bearer <access_token>` on all student endpoints
> **Design goal:** Pixel-faithful port — same layout, same UX flow, same data. Replace MUI with Tailwind + shadcn/ui. Replace axios+nonce with fetch+JWT.

---

## 1. Route Structure

Student routes live under the `(student)` route group — already scaffolded at `src/app/[locale]/(student)/`.

| URL path        | File                              | Reference page             |
| --------------- | --------------------------------- | -------------------------- |
| `/dashboard`    | `(student)/dashboard/page.tsx`    | Redirects → `/my-learning` |
| `/my-learning`  | `(student)/my-learning/page.tsx`  | `MyLearningPage.tsx` (new) |
| `/all-courses`  | `(student)/all-courses/page.tsx`  | `AllCoursesPage.tsx`       |
| `/my-orders`    | `(student)/my-orders/page.tsx`    | `OrdersPage.tsx`           |
| `/profile`      | `(student)/profile/page.tsx`      | `UserProfileForm.tsx`      |
| `/subscription` | `(student)/subscription/page.tsx` | `SubscriptionsPage.tsx`    |

> **Nav items are dynamic.** Fetch `GET /admin/navigation-settings` on app boot — only render nav items where `enabled: true`. Default enabled items: `my-learning`, `all-courses`, `my-orders`.

---

## 2. Layout — `(student)/layout.tsx`

The reference `DashboardLayout.tsx` has three zones:

```
┌─────────────────────────────────────────────────────────────┐
│  TopBar (fixed, full-width)  — logo · search · avatar · cart│
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   Sidebar    │   <children />                               │
│   (240px)    │   (scrollable content area)                  │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

- **Sidebar** collapses on mobile (hamburger in TopBar).
- **Cart drawer** slides in from right — triggered by `window.dispatchEvent(new Event('open-cart-sidebar'))`.
- Content area: `mt-[96px]` (below fixed header), `px-4 md:px-6 lg:px-8`.
- Background: `bg-[#f8f8f8]` light / `bg-neutral-900` dark.

### 2a. Theme colors

Fetch on app load (public endpoint, no auth):

```
GET /wp-json/lms-backend/v1/admin/color-settings
```

Response:

```json
{
  "success": true,
  "data": {
    "primary": "#0f217d",
    "secondary": "#16c2d5",
    "background": "#ffffff",
    "text": "#2E323E"
  }
}
```

Write these as CSS custom properties on `:root`:

```ts
document.documentElement.style.setProperty("--color-primary", data.primary);
document.documentElement.style.setProperty("--color-secondary", data.secondary);
document.documentElement.style.setProperty("--color-background", data.background);
document.documentElement.style.setProperty("--color-text", data.text);
```

Use `var(--color-primary)` everywhere instead of hardcoded hex values.

### 2b. Sidebar navigation

Fetch on app load (public endpoint):

```
GET /wp-json/lms-backend/v1/admin/navigation-settings
```

Response shape (keyed by slug):

```json
{
  "success": true,
  "data": {
    "my-learning":  { "slug": "my-learning",  "label": "My Learning",  "enabled": true },
    "all-courses":  { "slug": "all-courses",  "label": "All Courses",  "enabled": true },
    "my-orders":    { "slug": "my-orders",    "label": "My Orders",    "enabled": true },
    "my-courses":   { "slug": "my-courses",   "label": "My Courses",   "enabled": false },
    ...
  }
}
```

Render only `enabled: true` items. Use the `label` value (admin can rename). Map each `slug` → route and sidebar icon:

| slug                 | Route           | Icon component          |
| -------------------- | --------------- | ----------------------- |
| `my-learning`        | `/my-learning`  | `<BookOpenIcon />`      |
| `all-courses`        | `/all-courses`  | `<GraduationCapIcon />` |
| `my-orders`          | `/my-orders`    | `<ReceiptIcon />`       |
| `my-certificate`     | `/my-learning`  | `<AwardIcon />`         |
| `my-transcript`      | `/my-learning`  | `<ScrollIcon />`        |
| `student-card`       | `/my-learning`  | `<IdCardIcon />`        |
| `unlimited-learning` | `/subscription` | `<InfinityIcon />`      |
| `bundle-courses`     | `/all-courses`  | `<LayersIcon />`        |
| `special-offers`     | `/subscription` | `<TagIcon />`           |
| `my-profile`         | `/profile`      | `<UserIcon />`          |

---

## 3. Authentication

All student endpoints require `Authorization: Bearer <access_token>`.

Token lifecycle (already scaffolded in `src/app/api/auth/`):

| Action     | BFF route handler               | WP endpoint                            |
| ---------- | ------------------------------- | -------------------------------------- |
| Login      | `POST /api/auth/login`          | `POST /lms-backend/v1/auth/login`      |
| Register   | `POST /api/auth/register`       | `POST /lms-backend/v1/auth/register`   |
| Refresh    | `POST /api/auth/refresh` (auto) | `POST /lms-backend/v1/auth/refresh`    |
| Logout     | `POST /api/auth/logout`         | `POST /lms-backend/v1/auth/logout`     |
| Logout all | `POST /api/auth/logout-all`     | `POST /lms-backend/v1/auth/logout-all` |

Login response shape:

```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 3600,
    "user": {
      "id": 42,
      "email": "student@example.com",
      "display_name": "Alex M.",
      "avatar_url": "https://..."
    }
  }
}
```

Store `access_token` in an httpOnly cookie via the BFF. Never expose it to client JS.

---

## 4. Page: My Learning (`/my-learning`)

**Reference:** `MyLearningPage.tsx` + three tab components.

### Layout

```
My Learning                          ← h1
─────────────────────────────────────
[Active Training (N)] [Completed (N)] [Certificates (N)]   ← tab bar
─────────────────────────────────────
[Search ____________] [Sort ▾] [Reset]  ← filter bar (Active tab only)
─────────────────────────────────────
<course grid / certificate list>
─────────────────────────────────────
<PromoCardsSection />
```

### 4a. Summary counters

```
GET /wp-json/lms-backend/v1/student/summary
Authorization: Bearer <token>
```

Response:

```json
{
  "success": true,
  "data": {
    "header": {
      "user_display_name": "Alex M.",
      "user_avatar_url": "https://...",
      "title": "Welcome back",
      "subtitle": "Continue your learning journey"
    },
    "counters": {
      "active": 5,
      "completed": 3,
      "certificates": 2
    }
  }
}
```

Use `counters.active`, `counters.completed`, `counters.certificates` as tab badge numbers.

### 4b. Active Training tab

```
GET /wp-json/lms-backend/v1/student/courses
  ?access=active
  &page=1
  &per_page=12
  &search=<string>
  &orderby=recently_accessed|title|date
  &category=<term_id>
Authorization: Bearer <token>
```

Response:

```json
{
  "success": true,
  "data": {
    "courses": [ ...Course[] ],
    "total": 24,
    "page": 1,
    "per_page": 12,
    "totalPages": 2
  }
}
```

**Course card** (reference: `LearningCourseCard.tsx`):

```
┌──────────────────────────────────────────┐
│  [featured_image 16:9]                   │
├──────────────────────────────────────────┤
│  [course_cat_names chips]                │
│  Course title (name)                     │
│  ████████░░░░░░  47%  (user_progress)   │
│  [Resume →]                              │
└──────────────────────────────────────────┘
```

- Progress bar: `user_progress` 0–100.
- Button label: `user_status === 2` → "View Certificate"; else → "Resume".
- Link: `course.link` (WP course permalink).

### 4c. Completed Training tab

Same endpoint with `?access=completed`. Card reference: `CompletedCourseRow.tsx`.

```
┌─────────────────────────────────────────────────────────────┐
│  [thumbnail 80×80]  │  Course title                          │
│                     │  Completed · display_start_date        │
│                     │  [View Certificate]  [Download]        │
└─────────────────────────────────────────────────────────────┘
```

### 4d. Certificates tab

```
GET /wp-json/lms-backend/v1/student/certificates
  ?page=1
  &per_page=12
  &search=<string>
Authorization: Bearer <token>
```

Response:

```json
{
  "success": true,
  "data": {
    "certificates": [ ...Certificate[] ],
    "total": 8,
    "page": 1,
    "per_page": 12,
    "totalPages": 1
  }
}
```

**Certificate card** (reference: `CertificateCard.tsx`):

```
┌────────────────────────────────────────┐
│  [featured_image 16:9]                 │
├────────────────────────────────────────┤
│  Course title                          │
│  is_certificate_unlocked              │
│  [View] [Share] [Download PDF]         │
└────────────────────────────────────────┘
```

**Share certificate modal** — `POST /wp-json/lms-backend/v1/student/certificates/share`:

```json
{ "course_id": 123, "email": "recipient@example.com" }
```

### 4e. Sort options

| Value               | Label             |
| ------------------- | ----------------- |
| `recently_accessed` | Recently accessed |
| `title`             | Title A–Z         |
| `date`              | Date enrolled     |

### 4f. Promo cards section (bottom of page)

```
GET /wp-json/lms-backend/v1/admin/subscription-promo-settings
```

Response:

```json
{
  "success": true,
  "data": {
    "promos": [
      {
        "id": "hardcopy",
        "variant": "hardcopy",
        "title": "Get Your Hardcopy Certificate",
        "description": "...",
        "button_label": "Order Now",
        "button_url": "/certificate"
      }
    ]
  }
}
```

Render as horizontal card strip at page bottom. Variants: `hardcopy` (blue), `team` (green).

---

## 5. Page: All Courses (`/all-courses`)

**Reference:** `AllCoursesPage.tsx` + `AllCourses.tsx`.

### Layout

```
All Courses               [Subscription: Prime ×]
                          [View Subscription Status ↗]
─────────────────────────────────────────────────────
[  course grid — same card as Active Training tab  ]
─────────────────────────────────────────────────────
<PromoCardsSection />
```

### API

```
GET /wp-json/lms-backend/v1/student/courses
  ?access=all       ← no access filter = full catalog
  &page=1
  &per_page=12
  &search=<string>
  &category=<term_id>
Authorization: Bearer <token>
```

Same `CoursesResponse` shape as My Learning.

**Subscription badge** — fetch alongside courses:

```
GET /wp-json/lms-backend/v1/student/subscription
Authorization: Bearer <token>
```

Show `active_subscription.plan_name` or `lifetime_membership.product.name` as a chip next to the heading if present.

**Categories filter** — fetch from:

```
GET /wp-json/lms-backend/v1/admin/excluded-categories
```

This returns categories excluded from display. Use the full list from taxonomy minus those excluded.

Or fetch all categories:

```
GET /wp-json/lms-backend/v1/admin/all-categories
```

Response:

```json
{
  "success": true,
  "data": {
    "categories": [
      { "term_id": 5, "name": "Health & Safety", "slug": "health-safety", "count": 14 }
    ]
  }
}
```

---

## 6. Page: My Orders (`/my-orders`)

**Reference:** `OrdersPage.tsx`.

### Layout

```
My Orders                        N orders
─────────────────────────────────────────

▼ Order #1234   COMPLETED   12 Jan 2025   £49.00   2 items
  ─────────────────────────────────────────────────────────
  Payment Method: Stripe
  Order Total: £49.00
  ─────────────────────────────────────────────────────────
  Product                    Qty    Price
  Introduction to First Aid   1     £29.00
  Health & Safety Level 2     1     £20.00

▶ Order #1201   PROCESSING  ...
```

### API

```
GET /wp-json/lms-backend/v1/orders
  ?page=1
  &per_page=20
Authorization: Bearer <token>
```

Response:

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "order_id": 1234,
        "order_date": "12 Jan 2025",
        "order_total": "49.00",
        "order_status": "completed",
        "order_payment_method": "Stripe",
        "order_item_count": 2,
        "order_items": [
          {
            "order_item_id": 1,
            "order_item_name": "Introduction to First Aid",
            "order_item_quantity": 1,
            "order_item_total_price": 29.0
          }
        ]
      }
    ],
    "total": 5
  }
}
```

**Status colors:**

| Status       | Background              | Border                 | Text      |
| ------------ | ----------------------- | ---------------------- | --------- |
| `completed`  | `rgba(0,188,125,0.1)`   | `rgba(0,188,125,0.2)`  | `#00bc7d` |
| `processing` | `rgba(22,194,213,0.1)`  | `rgba(22,194,213,0.2)` | `#16c2d5` |
| `on-hold`    | `rgba(251,180,63,0.15)` | `rgba(251,180,63,0.3)` | `#d48a00` |
| default      | `#f7f8f8`               | `#bec5c9`              | `#73828a` |

---

## 7. Page: User Profile (`/profile`)

**Reference:** `UserProfileForm.tsx`.

### API — read

```
GET /wp-json/lms-backend/v1/users/me
Authorization: Bearer <token>
```

### API — update

```
POST /wp-json/lms-backend/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "display_name": "Alex M.",
  "email": "alex@example.com",
  "first_name": "Alex",
  "last_name": "M."
}
```

### API — avatar upload

```
POST /wp-json/lms-backend/v1/users/me/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image binary>
```

---

## 8. Page: Subscription (`/subscription`)

**Reference:** `SubscriptionsPage.tsx`.

### APIs

```
GET /wp-json/lms-backend/v1/student/subscription
Authorization: Bearer <token>
```

```
GET /wp-json/lms-backend/v1/subscription-plans
(public — no auth required)
```

Subscription plans response:

```json
{
  "success": true,
  "data": [
    {
      "type": "prime",
      "label": "Monthly Access",
      "billing": "per month",
      "featured": false,
      "price": 29,
      "regular_price": 49,
      "currency": "£",
      "product_id": 100,
      "checkout_url": "/checkout?product=100",
      "cta": "Get Started",
      "features": [
        { "text": "Access to all courses", "included": true },
        { "text": "Hardcopy Certificate", "included": false }
      ]
    }
  ]
}
```

---

## 9. TypeScript Types

Copy or adapt from the reference `src/front-end/api/v2/types.ts`. Key types:

```typescript
// From lms-backend/v1/student/courses
export interface Course {
  id: number;
  name: string;
  excerpt: string;
  featured_image: string;
  courseCat: number[];
  course_cat_names?: string[];
  link: string;
  price?: number | null;
  regular_price?: number | null;
  currency?: string;
  on_sale?: boolean;
  is_free?: boolean;
  units?: number;
  duration: number;
  is_enrolled?: boolean;
  user_progress: number; // 0-100
  user_status: number; // 1=active 2=complete 3=passed 4=failed 5=expired
  user_expiry: string;
  start_date: number;
  display_start_date: string;
}

export interface CoursesResponse {
  courses: Course[];
  total: number;
  page: number;
  per_page: number;
  totalPages: number;
}

// From lms-backend/v1/student/summary
export interface StudentSummary {
  header: {
    user_display_name: string;
    user_avatar_url: string;
    title: string;
    subtitle: string;
  };
  counters: {
    active: number;
    completed: number;
    certificates: number;
  };
}

// From lms-backend/v1/student/certificates
export interface Certificate {
  course_id: number;
  title: string;
  slug: string;
  course_permalink: string;
  featured_image: string | false;
  progress: number;
  lms_certificate_url: string | false;
  is_certificate_unlocked: string; // '1' or ''
  has_course_certificate: boolean;
  is_transcript_unlocked: string;
  transcript_url: string;
  certificate_url: string;
  is_purchased: boolean;
  is_certificate_generated: boolean;
}

// From lms-backend/v1/orders
export interface OrderItem {
  order_item_id: number;
  order_item_name: string;
  order_item_quantity: number;
  order_item_total_price: number;
}

export interface Order {
  order_id: number;
  order_date: string;
  order_total: string;
  order_status: string;
  order_payment_method: string;
  order_item_count: number;
  order_items: OrderItem[];
}

// From lms-backend/v1/admin/navigation-settings
export interface NavItem {
  slug: string;
  label: string;
  enabled: boolean;
}

// From lms-backend/v1/admin/color-settings
export interface ColorSettings {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}
```

---

## 10. API Client Pattern

All student endpoints wrap responses: `{ success: true, data: { ... } }`. Unwrap in a shared helper:

```typescript
// src/lib/api/lms-client.ts
const BASE = process.env.NEXT_PUBLIC_WP_API_URL + "/wp-json/lms-backend/v1";

async function lmsGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    next: { revalidate: 0 }, // student data is always fresh
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  const json = await res.json();
  return (json.data ?? json) as T;
}

async function lmsPost<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  const json = await res.json();
  return (json.data ?? json) as T;
}
```

Public endpoints (no token): `color-settings`, `navigation-settings`, `subscription-plans`.

---

## 11. Migration Map — Old `student-dashboard/v2` → New `lms-backend/v1`

| Old endpoint                                             | New endpoint                                            | Notes                           |
| -------------------------------------------------------- | ------------------------------------------------------- | ------------------------------- |
| `POST /student-dashboard/v2/courses`                     | `GET /lms-backend/v1/student/courses`                   | GET with query params now       |
| `GET /student-dashboard/v2/my-learning/summary`          | `GET /lms-backend/v1/student/summary`                   |                                 |
| `GET /student-dashboard/v2/certificates`                 | `GET /lms-backend/v1/student/certificates`              |                                 |
| `POST /student-dashboard/v2/certificates/share`          | `POST /lms-backend/v1/student/certificates/share`       |                                 |
| `GET /student-dashboard/v2/subscription`                 | `GET /lms-backend/v1/student/subscription`              |                                 |
| `GET /student-dashboard/v2/subscription-plans`           | `GET /lms-backend/v1/subscription-plans`                |                                 |
| `GET /student-dashboard/v2/subscription-promos/settings` | `GET /lms-backend/v1/admin/subscription-promo-settings` | New endpoint                    |
| `GET /sa-rest-api/v1/color-settings`                     | `GET /lms-backend/v1/admin/color-settings`              | Different namespace             |
| `GET /sa-rest-api/v1/navigation-settings`                | `GET /lms-backend/v1/admin/navigation-settings`         |                                 |
| Auth: `X-WP-Nonce` + cookie                              | Auth: `Authorization: Bearer <access_token>`            | JWT-based, no WP session needed |

---

## 12. Design Tokens (Tailwind)

Extend `tailwind.config.ts` with the dynamic color vars:

```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      'lms-primary':    'var(--color-primary)',
      'lms-secondary':  'var(--color-secondary)',
      'lms-background': 'var(--color-background)',
      'lms-text':       'var(--color-text)',
    },
  },
}
```

Use `text-lms-primary`, `bg-lms-secondary`, etc. in components.

---

## 13. Pagination

All list endpoints return `total`, `page`, `per_page`, `totalPages`. Use shadcn/ui `Pagination` component. On page change, scroll to the top of the list grid:

```typescript
const gridRef = useRef<HTMLDivElement>(null);
const handlePageChange = (p: number) => {
  setPage(p);
  gridRef.current?.scrollIntoView({ behavior: "smooth" });
};
```

---

## 14. Loading States

- Use shadcn/ui `Skeleton` for initial page loads.
- Course grid: render 12 skeleton cards matching the card dimensions.
- Order list: render 3 skeleton accordion rows.
- Certificates: render 8 skeleton cards.

---

## 15. Error States

| Scenario                 | UI                                                  |
| ------------------------ | --------------------------------------------------- |
| API error / network down | Red banner: "Unable to load. Please try again."     |
| Empty active courses     | Illustration + "Start a course" CTA                 |
| Empty completed courses  | "No completed courses yet."                         |
| Empty certificates       | "Complete a course to earn your first certificate." |
| Empty orders             | Receipt icon + "No orders yet."                     |

---

## 16. Implementation Order

1. `(student)/layout.tsx` — DashboardLayout (sidebar, topbar, responsive)
2. Theme provider — fetch color-settings, write CSS vars
3. Nav provider — fetch navigation-settings, render enabled items
4. `my-learning/page.tsx` — summary + three tabs (core page)
5. `all-courses/page.tsx` — catalog grid + search + pagination
6. `my-orders/page.tsx` — accordion list
7. `profile/page.tsx` — form + avatar upload
8. `subscription/page.tsx` — plans + current status
