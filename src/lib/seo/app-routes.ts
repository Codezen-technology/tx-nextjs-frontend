/**
 * Every path this application serves with its own route file.
 *
 * Two things read it:
 *
 *  1. `src/app/sitemap.ts` builds its static-route entries from the indexable
 *     rows here, so the sitemap and the app cannot disagree about what exists.
 *  2. The WordPress catch-all enumeration subtracts every path claimed here.
 *     WordPress has its own `login`, `register`, `cart`, `my-account` and `home`
 *     pages; without this, they are advertised as if the catch-all served them.
 *
 * This replaced a denylist of WordPress slugs (`EXPLICIT_ROUTES`), which drifted
 * silently every time a page was added on WordPress — `/register`,
 * `/business-dashboard`, `/shop`, `/home`, `/activity` and `/pwa` all reached
 * the live sitemap that way.
 *
 * ADDING A ROUTE: add its entry here. `seo-app-routes.test.ts` walks
 * `src/app/[locale]/**` and fails when a route file has no entry, so this list
 * can be one commit stale, not one release.
 */

export type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly";

export interface AppRoute {
  /** Path as served, no locale prefix, no trailing slash. `/` for the root. */
  path: string;
  /**
   * Whether a crawler may index this path. `false` covers auth, transactional,
   * protected and internal routes — each of which also carries a `noindex`
   * directive of its own and a `robots.txt` disallow.
   */
  indexable: boolean;
  /** Sitemap hints. Only read for static indexable routes. */
  changeFrequency?: ChangeFrequency;
  priority?: number;
  /**
   * True for dynamic segments (`/course/[slug]`). Those enter the sitemap
   * through their own data source, not through the static list.
   */
  dynamic?: boolean;
}

export const APP_ROUTES: readonly AppRoute[] = [
  // Marketing — indexable, static
  { path: "/", indexable: true, changeFrequency: "daily", priority: 1.0 },
  { path: "/all-courses", indexable: true, changeFrequency: "daily", priority: 0.9 },
  { path: "/bundles", indexable: true, changeFrequency: "weekly", priority: 0.8 },
  { path: "/blog", indexable: true, changeFrequency: "daily", priority: 0.8 },
  { path: "/pricing", indexable: true, changeFrequency: "weekly", priority: 0.7 },
  { path: "/reviews", indexable: true, changeFrequency: "weekly", priority: 0.7 },
  { path: "/certificate", indexable: true, changeFrequency: "monthly", priority: 0.6 },
  { path: "/help", indexable: true, changeFrequency: "monthly", priority: 0.6 },
  { path: "/about-us", indexable: true, changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact-us", indexable: true, changeFrequency: "monthly", priority: 0.5 },
  { path: "/cancellations", indexable: true, changeFrequency: "monthly", priority: 0.5 },
  { path: "/support-request", indexable: true, changeFrequency: "monthly", priority: 0.5 },
  { path: "/verify-certificate", indexable: true, changeFrequency: "monthly", priority: 0.4 },
  { path: "/terms-and-conditions", indexable: true, changeFrequency: "yearly", priority: 0.2 },
  { path: "/privacy-policy", indexable: true, changeFrequency: "yearly", priority: 0.2 },

  // Marketing — indexable, dynamic. Enumerated by their own sitemap sources.
  { path: "/course/[slug]", indexable: true, dynamic: true },
  { path: "/course-cat/[slug]", indexable: true, dynamic: true },
  { path: "/blog/[slug]", indexable: true, dynamic: true },
  { path: "/blog/category/[slug]", indexable: true, dynamic: true },
  { path: "/bundles/[slug]", indexable: true, dynamic: true },
  { path: "/product/[slug]", indexable: true, dynamic: true },
  // The WordPress catch-all itself. Its pages are enumerated from the CMS.
  { path: "/[slug]", indexable: true, dynamic: true },

  // Not indexable — search results
  { path: "/search", indexable: false },

  // Not indexable — auth
  { path: "/login", indexable: false },
  { path: "/register", indexable: false },
  { path: "/forgot-password", indexable: false },
  { path: "/reset-password", indexable: false },

  // Not indexable — transactional
  { path: "/cart", indexable: false },
  { path: "/checkout", indexable: false },
  { path: "/checkout/pay", indexable: false },
  { path: "/order-confirmation/[orderId]", indexable: false, dynamic: true },

  // Not indexable — student area
  { path: "/courses", indexable: false },
  { path: "/dashboard", indexable: false },
  { path: "/dashboard/admin/subscription-plans", indexable: false },
  { path: "/dashboard/admin/user-switching", indexable: false },
  { path: "/dashboard/all-courses", indexable: false },
  { path: "/dashboard/certificate", indexable: false },
  { path: "/dashboard/my-learning", indexable: false },
  { path: "/dashboard/my-orders", indexable: false },
  { path: "/dashboard/profile", indexable: false },
  { path: "/dashboard/subscription", indexable: false },
  { path: "/learn/[courseId]/start", indexable: false, dynamic: true },
  { path: "/learn/[courseId]/[unitId]", indexable: false, dynamic: true },

  // Not indexable — business area
  { path: "/business-dashboard", indexable: false },
  { path: "/business-dashboard/analytics", indexable: false },
  { path: "/business-dashboard/certificates", indexable: false },
  { path: "/business-dashboard/certificates/[courseId]", indexable: false, dynamic: true },
  { path: "/business-dashboard/courses", indexable: false },
  { path: "/business-dashboard/courses/assign", indexable: false },
  { path: "/business-dashboard/courses/available", indexable: false },
  { path: "/business-dashboard/learners", indexable: false },
  { path: "/business-dashboard/learners/[id]", indexable: false, dynamic: true },
  { path: "/business-dashboard/learners/add", indexable: false },
  { path: "/business-dashboard/learners/assignments", indexable: false },
  { path: "/business-dashboard/licences", indexable: false },
  { path: "/business-dashboard/managers", indexable: false },
  { path: "/business-dashboard/orders", indexable: false },
  { path: "/business-dashboard/pricing", indexable: false },
  { path: "/business-dashboard/profile", indexable: false },
  { path: "/business-dashboard/reviews", indexable: false },
  { path: "/business-dashboard/subscriptions", indexable: false },

  // Not indexable — internal
  { path: "/design-system", indexable: false },
] as const;

/** Static indexable paths, in declaration order — the sitemap's static entries. */
export const staticIndexableRoutes: readonly AppRoute[] = APP_ROUTES.filter(
  (r) => r.indexable && !r.dynamic,
);

/**
 * First path segments this app already claims.
 *
 * A WordPress page whose slug appears here is served by a dedicated route (or
 * deliberately not served at all) — never by the catch-all — so the catch-all
 * enumeration must not emit it. `/[slug]` itself is excluded: it is the
 * catch-all, not a claim on any particular slug.
 */
export const claimedTopLevelSlugs: ReadonlySet<string> = new Set(
  APP_ROUTES.map((r) => r.path.split("/")[1] ?? "").filter(
    (segment) => segment && !segment.startsWith("["),
  ),
);

/**
 * WordPress-only slugs with no frontend route, which the catch-all would
 * otherwise render as an empty page. Kept separate from the route registry:
 * these describe the CMS, not this app.
 *
 * The Rank Math gate in the sitemap catches most of them on its own — these are
 * the ones WordPress reports as indexable while serving content this app has no
 * route for.
 */
export const wordpressOnlySlugs: ReadonlySet<string> = new Set([
  "course-player",
  "course-selector-page",
  "lostpassword",
  "my-account",
  "shop",
  "sitemap",
  "student-portal",
  "thank-you-for-ordering-certificate",
]);
