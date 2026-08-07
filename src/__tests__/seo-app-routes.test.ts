import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import path from "node:path";
import {
  APP_ROUTES,
  staticIndexableRoutes,
  claimedTopLevelSlugs,
  wordpressOnlySlugs,
} from "@/lib/seo/app-routes";

/**
 * The route registry is the sitemap's idea of what this app serves. A denylist
 * of WordPress slugs held that job before and drifted silently — `/register`,
 * `/business-dashboard`, `/shop` and `/home` all reached the live sitemap.
 *
 * This walks the filesystem so the registry can be one commit stale, not one
 * release: a new `page.tsx` with no entry fails here.
 */

const APP_DIR = path.resolve(__dirname, "../app/[locale]");

/** Every route path the App Router serves, derived from the route files. */
function routePathsFromFilesystem(dir: string, prefix = ""): string[] {
  const paths: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name === "page.tsx") {
      paths.push(prefix === "" ? "/" : prefix);
      continue;
    }
    if (!entry.isDirectory()) continue;

    // Route groups — (marketing), (shop) — organise files, not URLs.
    const segment = /^\(.*\)$/.test(entry.name) ? prefix : `${prefix}/${entry.name}`;
    paths.push(...routePathsFromFilesystem(path.join(dir, entry.name), segment));
  }

  return paths;
}

describe("app route registry", () => {
  const filesystemRoutes = routePathsFromFilesystem(APP_DIR);
  const registered = new Set(APP_ROUTES.map((r) => r.path));

  it("finds the route files it is supposed to walk", () => {
    expect(filesystemRoutes.length).toBeGreaterThan(50);
    expect(filesystemRoutes).toContain("/");
    expect(filesystemRoutes).toContain("/course/[slug]");
  });

  it("has an entry for every route file", () => {
    const missing = filesystemRoutes.filter((p) => !registered.has(p));

    expect(missing, `add these to src/lib/seo/app-routes.ts: ${missing.join(", ")}`).toEqual([]);
  });

  it("has no entry for a route that no longer exists", () => {
    const filesystem = new Set(filesystemRoutes);
    const stale = APP_ROUTES.map((r) => r.path).filter((p) => !filesystem.has(p));

    expect(stale, `remove these from src/lib/seo/app-routes.ts: ${stale.join(", ")}`).toEqual([]);
  });

  it("lists each path once", () => {
    expect(registered.size).toBe(APP_ROUTES.length);
  });
});

describe("indexability flags", () => {
  it.each([
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/cart",
    "/checkout",
    "/checkout/pay",
    "/order-confirmation/[orderId]",
    "/search",
    "/design-system",
    "/dashboard",
    "/business-dashboard",
    "/courses",
  ])("marks %s non-indexable", (routePath) => {
    expect(APP_ROUTES.find((r) => r.path === routePath)?.indexable).toBe(false);
  });

  it.each(["/", "/all-courses", "/blog", "/pricing", "/course/[slug]", "/product/[slug]"])(
    "marks %s indexable",
    (routePath) => {
      expect(APP_ROUTES.find((r) => r.path === routePath)?.indexable).toBe(true);
    },
  );

  it("gives every static indexable route a sitemap priority", () => {
    const missing = staticIndexableRoutes.filter(
      (r) => r.priority === undefined || r.changeFrequency === undefined,
    );

    expect(missing.map((r) => r.path)).toEqual([]);
  });

  it("keeps dynamic routes out of the static sitemap list", () => {
    expect(staticIndexableRoutes.some((r) => r.path.includes("["))).toBe(false);
  });
});

describe("claimed slugs", () => {
  it.each(["login", "register", "cart", "checkout", "business-dashboard", "dashboard", "blog"])(
    "claims %s so the WordPress catch-all cannot advertise it",
    (slug) => {
      expect(claimedTopLevelSlugs.has(slug)).toBe(true);
    },
  );

  it("does not claim a slug only WordPress serves", () => {
    expect(claimedTopLevelSlugs.has("training-teams")).toBe(false);
  });

  it("never treats a dynamic segment as a claimed slug", () => {
    expect([...claimedTopLevelSlugs].some((s) => s.startsWith("["))).toBe(false);
  });

  it("lists WordPress-only pages this app has no route for", () => {
    expect(wordpressOnlySlugs.has("shop")).toBe(true);
    expect(wordpressOnlySlugs.has("my-account")).toBe(true);
    expect(wordpressOnlySlugs.has("student-portal")).toBe(true);
  });
});
