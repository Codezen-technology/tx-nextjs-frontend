import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import sitemap from "@/app/sitemap";

const WP = "http://localhost/wp-json";
const LMS = `${WP}/lms-backend/v1`;
const SITE = "http://localhost:3000";

/** Routes that must never appear — protected, transactional, or noindex. */
const EXCLUDED = [
  "/dashboard",
  "/business-dashboard",
  "/learn",
  "/profile",
  "/orders",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/cart",
  "/checkout",
  "/order-confirmation",
  "/search",
  "/design-system",
  "/api",
];

function mockSources() {
  server.use(
    http.get(`${LMS}/courses`, () =>
      HttpResponse.json({
        success: true,
        data: {
          items: [
            { id: 1, slug: "first-aid", date_modified: 1785502905 },
            { id: 2, slug: "food-hygiene", date_modified: 1785489515 },
          ],
        },
      }),
    ),
    http.get(`${LMS}/course-categories`, () =>
      HttpResponse.json({
        success: true,
        data: { items: [{ id: 1, slug: "first-aid-courses", name: "First Aid", count: 3 }] },
      }),
    ),
    http.get(`${LMS}/bundles`, () =>
      HttpResponse.json({ success: true, data: { items: [{ id: 1, slug: "starter-bundle" }] } }),
    ),
    http.get(`${LMS}/pages`, () =>
      HttpResponse.json({
        success: true,
        data: {
          items: [
            { id: 1, slug: "training-teams", title: "Training Teams", template: null },
            { id: 2, slug: "force-for-good", title: "Force for Good", template: null },
            // Has its own route + static entry — must not be emitted twice.
            { id: 3, slug: "about-us", title: "About Us", template: null },
          ],
        },
      }),
    ),
    http.get(`${WP}/wc/store/v1/products`, () =>
      HttpResponse.json([{ id: 9, slug: "hardcopy-certificate", name: "Hardcopy Certificate" }]),
    ),
    http.get(`${WP}/wp/v2/posts`, () =>
      HttpResponse.json(
        [
          {
            id: 5,
            slug: "nursing-assistant-certification",
            modified_gmt: "2026-01-15T10:30:00",
            title: { rendered: "Post" },
            excerpt: { rendered: "" },
            date: "2026-01-01T00:00:00",
          },
        ],
        { headers: { "X-WP-Total": "1", "X-WP-TotalPages": "1" } },
      ),
    ),
    http.get(`${WP}/wp/v2/categories`, () =>
      HttpResponse.json([{ id: 3, slug: "health-social-care", name: "Health", count: 1 }]),
    ),
  );
}

beforeEach(() => mockSources());

describe("sitemap — coverage", () => {
  it("includes every public route family", async () => {
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toContain(SITE);
    expect(urls).toContain(`${SITE}/all-courses`);
    expect(urls).toContain(`${SITE}/course/first-aid`);
    expect(urls).toContain(`${SITE}/course-cat/first-aid-courses`);
    expect(urls).toContain(`${SITE}/bundles/starter-bundle`);
    expect(urls).toContain(`${SITE}/product/hardcopy-certificate`);
    expect(urls).toContain(`${SITE}/blog/nursing-assistant-certification`);
    expect(urls).toContain(`${SITE}/blog/category/health-social-care`);
  });

  it("includes the route families that were missing entirely", async () => {
    const urls = (await sitemap()).map((e) => e.url);

    // /bundles, /blog/category, /product, /pricing and /certificate were all absent.
    expect(urls).toContain(`${SITE}/bundles`);
    expect(urls).toContain(`${SITE}/pricing`);
    expect(urls).toContain(`${SITE}/certificate`);
  });

  it("enumerates catch-all WordPress pages rather than hardcoding them", async () => {
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toContain(`${SITE}/training-teams`);
    expect(urls).toContain(`${SITE}/force-for-good`);
  });
});

describe("sitemap — exclusions", () => {
  it.each(EXCLUDED)("omits %s", async (path) => {
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls.some((u) => u.startsWith(`${SITE}${path}`))).toBe(false);
  });

  it("does not emit a page twice when it also has an explicit route", async () => {
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls.filter((u) => u === `${SITE}/about-us`)).toHaveLength(1);
  });

  it("emits no duplicate URLs at all", async () => {
    const urls = (await sitemap()).map((e) => e.url);

    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("sitemap — URL form", () => {
  it("never emits a trailing slash", async () => {
    // Canonicals are slashless; a sitemap entry that disagrees is a wasted signal.
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls.filter((u) => u.endsWith("/"))).toEqual([]);
  });

  it("emits absolute URLs on the frontend origin", async () => {
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls.every((u) => u.startsWith(SITE))).toBe(true);
  });
});

describe("sitemap — lastModified", () => {
  it("uses the real modification date for courses", async () => {
    const entry = (await sitemap()).find((e) => e.url === `${SITE}/course/first-aid`);

    expect(entry?.lastModified).toEqual(new Date(1785502905 * 1000));
  });

  it("uses the real modification date for blog posts", async () => {
    const entry = (await sitemap()).find((e) =>
      e.url.endsWith("/blog/nursing-assistant-certification"),
    );

    expect(entry?.lastModified).toEqual(new Date("2026-01-15T10:30:00Z"));
  });

  it("does not stamp every entry with the current time", async () => {
    // The previous implementation called new Date() per entry, claiming the
    // whole site changed today on every fetch.
    const entries = await sitemap();
    const now = Date.now();

    const stampedNow = entries.filter(
      (e) => e.lastModified && Math.abs(now - new Date(e.lastModified).getTime()) < 60_000,
    );
    expect(stampedNow).toEqual([]);
  });

  it("gives distinct dates to entries with distinct source dates", async () => {
    const entries = await sitemap();
    const first = entries.find((e) => e.url.endsWith("/course/first-aid"));
    const second = entries.find((e) => e.url.endsWith("/course/food-hygiene"));

    expect(first?.lastModified).not.toEqual(second?.lastModified);
  });
});

describe("sitemap — degradation", () => {
  it("still emits static routes when every upstream fails", async () => {
    server.use(
      http.get(`${LMS}/courses`, () => HttpResponse.error()),
      http.get(`${LMS}/course-categories`, () => HttpResponse.error()),
      http.get(`${LMS}/bundles`, () => HttpResponse.error()),
      http.get(`${LMS}/pages`, () => HttpResponse.error()),
      http.get(`${WP}/wc/store/v1/products`, () => HttpResponse.error()),
      http.get(`${WP}/wp/v2/posts`, () => HttpResponse.error()),
      http.get(`${WP}/wp/v2/categories`, () => HttpResponse.error()),
    );

    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toContain(SITE);
    expect(urls).toContain(`${SITE}/all-courses`);
  });

  it("drops only the failing source, keeping the others", async () => {
    server.use(http.get(`${LMS}/bundles`, () => HttpResponse.error()));

    const urls = (await sitemap()).map((e) => e.url);

    expect(urls.some((u) => u.includes("/bundles/"))).toBe(false);
    expect(urls).toContain(`${SITE}/course/first-aid`);
  });
});
