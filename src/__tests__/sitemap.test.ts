import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import sitemap from "@/app/sitemap";

const WP = "http://localhost/wp-json";
const LMS = `${WP}/lms-backend/v1`;
const SITE = "http://localhost:3000";

/**
 * WordPress pages, as production actually reports them.
 *
 * `canonical: null` is how Rank Math answers for a page WordPress does not
 * publish at that path — a 404 head (`shop`) or a noindex page (`activity`,
 * `pwa`). `home` answers with the site root, which the path guard rejects.
 * Every one of these reached the live sitemap under the old denylist.
 */
const WP_PAGES: Record<string, string | null> = {
  "training-teams": "/training-teams/",
  "force-for-good": "/force-for-good/",
  "about-us": "/about-us/",
  shop: null,
  activity: null,
  activate: null,
  pwa: null,
  home: "/",
  register: "/register/",
};

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
          items: Object.keys(WP_PAGES).map((slug, i) => ({
            id: i + 1,
            slug,
            title: slug,
            template: null,
          })),
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
    // Gate B: WordPress declares a page indexable by answering with a canonical
    // for that exact path.
    http.get(`${WP}/rankmath/v1/getHead`, ({ request }) => {
      const asked = new URL(request.url).searchParams.get("url") ?? "";
      const slug = new URL(asked).pathname.replace(/^\/|\/$/g, "");
      const canonical = WP_PAGES[slug];
      const head = canonical
        ? `<title>${slug}</title><link rel="canonical" href="http://localhost${canonical}" />`
        : `<title>Page Not Found - Training Excellence</title><meta name="robots" content="follow, noindex"/>`;
      return HttpResponse.json({ success: true, head });
    }),
  );
}

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  mockSources();
  // The sitemap logs empty and truncated families; keep the suite readable.
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

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

describe("sitemap — paginated sources", () => {
  /** Serves `total` items 100 at a time, the way every upstream here behaves. */
  function paginated(total: number, slug: (i: number) => string) {
    return ({ request }: { request: Request }) => {
      const params = new URL(request.url).searchParams;
      const page = Number(params.get("page") ?? 1);
      const perPage = Number(params.get("per_page") ?? 10);
      // WordPress rejects an over-large page rather than clamping to it.
      if (perPage > 100) {
        return HttpResponse.json({ code: "rest_invalid_param" }, { status: 400 });
      }
      const start = (page - 1) * perPage;
      const items = Array.from(
        { length: Math.max(0, Math.min(perPage, total - start)) },
        (_, i) => ({
          id: start + i + 1,
          slug: slug(start + i + 1),
        }),
      );
      return { items, total, perPage, page };
    };
  }

  it("enumerates all 238 courses, not just the first page of 100", async () => {
    const source = paginated(238, (i) => `course-${i}`);
    server.use(
      http.get(`${LMS}/courses`, (info) => {
        const result = source(info);
        if (result instanceof HttpResponse) return result;
        return HttpResponse.json({
          success: true,
          data: { items: result.items, total: result.total },
        });
      }),
    );

    const urls = (await sitemap()).map((e) => e.url);
    const courseUrls = urls.filter((u) => u.includes("/course/"));

    expect(courseUrls).toHaveLength(238);
    expect(courseUrls).toContain(`${SITE}/course/course-1`);
    expect(courseUrls).toContain(`${SITE}/course/course-238`);
  });

  it("enumerates all 280 products", async () => {
    const source = paginated(280, (i) => `product-${i}`);
    server.use(
      http.get(`${WP}/wc/store/v1/products`, (info) => {
        const result = source(info);
        if (result instanceof HttpResponse) return result;
        return HttpResponse.json(result.items);
      }),
    );

    const urls = (await sitemap()).map((e) => e.url);

    expect(urls.filter((u) => u.includes("/product/"))).toHaveLength(280);
  });

  it("enumerates every blog post across pages", async () => {
    const source = paginated(150, (i) => `post-${i}`);
    server.use(
      http.get(`${WP}/wp/v2/posts`, (info) => {
        const result = source(info);
        if (result instanceof HttpResponse) return result;
        return HttpResponse.json(
          result.items.map((p) => ({
            ...p,
            title: { rendered: "Post" },
            excerpt: { rendered: "" },
            date: "2026-01-01T00:00:00",
          })),
          {
            headers: {
              "X-WP-Total": "150",
              "X-WP-TotalPages": String(Math.ceil(150 / result.perPage)),
            },
          },
        );
      }),
    );

    const urls = (await sitemap()).map((e) => e.url);
    const postUrls = urls.filter((u) => u.includes("/blog/") && !u.includes("/blog/category/"));

    expect(postUrls).toHaveLength(150);
  });

  it("never asks an upstream for more than 100 items in one page", async () => {
    // per_page=500 is HTTP 400 on wp/v2/posts — which is how every blog URL
    // vanished from the live sitemap while the document still looked healthy.
    const requested: number[] = [];
    server.use(
      http.get(`${WP}/wp/v2/posts`, ({ request }) => {
        const perPage = Number(new URL(request.url).searchParams.get("per_page") ?? 0);
        requested.push(perPage);
        if (perPage > 100)
          return HttpResponse.json({ code: "rest_invalid_param" }, { status: 400 });
        return HttpResponse.json([], { headers: { "X-WP-Total": "0", "X-WP-TotalPages": "0" } });
      }),
    );

    await sitemap();

    expect(requested.length).toBeGreaterThan(0);
    expect(Math.max(...requested)).toBeLessThanOrEqual(100);
  });

  it("keeps the pages it already collected when a later page fails", async () => {
    server.use(
      http.get(`${LMS}/courses`, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get("page") ?? 1);
        if (page > 1) return HttpResponse.error();
        return HttpResponse.json({
          success: true,
          data: {
            items: Array.from({ length: 100 }, (_, i) => ({ id: i + 1, slug: `course-${i + 1}` })),
            total: 238,
          },
        });
      }),
    );

    const urls = (await sitemap()).map((e) => e.url);

    expect(urls.filter((u) => u.includes("/course/"))).toHaveLength(100);
    expect(urls).toContain(SITE);
  });

  it("logs a family that resolves to nothing", async () => {
    server.use(
      http.get(`${WP}/wp/v2/posts`, () =>
        HttpResponse.json([], { headers: { "X-WP-Total": "0", "X-WP-TotalPages": "0" } }),
      ),
    );

    await sitemap();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("blog posts"));
  });
});

describe("sitemap — membership", () => {
  it("keeps WordPress pages that self-canonicalise", async () => {
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toContain(`${SITE}/training-teams`);
    expect(urls).toContain(`${SITE}/force-for-good`);
  });

  it.each([
    ["shop", "a soft 404 — WordPress serves a 404 head for it"],
    ["activity", "noindex on WordPress, no canonical"],
    ["activate", "noindex on WordPress, no canonical"],
    ["pwa", "noindex on WordPress, no canonical"],
    ["home", "canonicalises to the site root — duplicate of /"],
    ["register", "an auth route this app serves as noindex"],
  ])("drops /%s (%s)", async (slug) => {
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).not.toContain(`${SITE}/${slug}`);
  });

  it("drops a WordPress page whose slug this app already routes", async () => {
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls.filter((u) => u === `${SITE}/about-us`)).toHaveLength(1);
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
