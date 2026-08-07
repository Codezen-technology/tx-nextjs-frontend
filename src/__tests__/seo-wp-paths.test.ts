import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import { fetchRankMathSeo } from "@/lib/seo/server";
import { wpPath, normalizePath } from "@/lib/seo/wp-paths";

/**
 * The WP↔Next path mapping contract.
 *
 * Both bugs this suite exists to prevent were wrong path literals: blog posts
 * requested `/{slug}` and course categories `/course-category/{slug}`. Rank Math
 * answered 200 for both — with the homepage head and a 404 head respectively —
 * so nothing failed. Every route family below is asserted to resolve its OWN
 * metadata, which is the assertion that would have caught them.
 *
 * ADDING A ROUTE: add its `wpPath` entry and a case here.
 */

const WP = "http://localhost";

/** Paths WordPress actually serves, verified against production sitemaps. */
const WP_ROUTES: Record<string, string> = {
  "/": "Homepage",
  "/course/health-and-safety-officer-training": "Course",
  "/course-cat/first-aid-courses": "Course Category",
  "/blog/how-to-get-a-nursing-assistant-certification": "Blog Post",
  "/blog/category/health-social-care": "Blog Category",
  "/bundles/starter-bundle": "Bundle",
  "/product/hardcopy-certificate": "Product",
  "/about-us": "About Us",
};

/**
 * Stands in for Rank Math: serves the matching page's head for a known URL, and
 * the HOMEPAGE head for anything else — reproducing the exact behaviour that let
 * both bugs ship. A wrong mapping fails these tests instead of shipping.
 */
function mockRankMath() {
  server.use(
    http.get(`${WP}/wp-json/rankmath/v1/getHead`, ({ request }) => {
      const asked = new URL(request.url).searchParams.get("url") ?? "";
      const path = normalizePath(new URL(asked).pathname);
      const known = WP_ROUTES[path];

      const head = known
        ? `<title>${known}</title><link rel="canonical" href="${WP}${path === "/" ? "/" : `${path}/`}" />`
        : `<title>Training Excellence - Get Skilled, Get Certified</title><link rel="canonical" href="${WP}/" />`;

      return HttpResponse.json({ success: true, head });
    }),
  );
}

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  mockRankMath();
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

describe("wpPath — table shape", () => {
  it("maps every route family WordPress serves", () => {
    expect(Object.keys(wpPath).sort()).toEqual([
      "blogCategory",
      "blogPost",
      "bundle",
      "course",
      "courseCategory",
      "home",
      "page",
      "product",
    ]);
  });

  it("builds the paths WordPress actually serves", () => {
    expect(wpPath.home()).toBe("/");
    expect(wpPath.course("x")).toBe("/course/x/");
    expect(wpPath.courseCategory("x")).toBe("/course-cat/x/");
    expect(wpPath.blogPost("x")).toBe("/blog/x/");
    expect(wpPath.blogCategory("x")).toBe("/blog/category/x/");
    expect(wpPath.bundle("x")).toBe("/bundles/x/");
    expect(wpPath.product("x")).toBe("/product/x/");
    expect(wpPath.page("x")).toBe("/x/");
  });

  it("does not map blog posts to the bare slug", () => {
    // The shipped bug. `/{slug}` is the catch-all page path, not a post path.
    expect(wpPath.blogPost("x")).not.toBe(wpPath.page("x"));
  });

  it("does not map course categories to /course-category/", () => {
    // The other shipped bug. WordPress serves /course-cat/, not /course-category/.
    expect(wpPath.courseCategory("x")).not.toContain("/course-category/");
  });
});

describe("normalizePath", () => {
  it("strips a trailing slash", () => {
    expect(normalizePath("/course/x/")).toBe("/course/x");
  });

  it("preserves the root", () => {
    expect(normalizePath("/")).toBe("/");
  });

  it("collapses repeated trailing slashes", () => {
    expect(normalizePath("/course/x///")).toBe("/course/x");
  });
});

describe("every route family resolves its own metadata", () => {
  const cases: [string, string, string][] = [
    ["homepage", wpPath.home(), "Homepage"],
    ["course", wpPath.course("health-and-safety-officer-training"), "Course"],
    ["course category", wpPath.courseCategory("first-aid-courses"), "Course Category"],
    ["blog post", wpPath.blogPost("how-to-get-a-nursing-assistant-certification"), "Blog Post"],
    ["blog category", wpPath.blogCategory("health-social-care"), "Blog Category"],
    ["bundle", wpPath.bundle("starter-bundle"), "Bundle"],
    ["product", wpPath.product("hardcopy-certificate"), "Product"],
    ["catch-all page", wpPath.page("about-us"), "About Us"],
  ];

  it.each(cases)("%s resolves its own title, not the homepage's", async (_name, path, title) => {
    const seo = await fetchRankMathSeo(path);

    expect(seo?.title).toBe(title);
  });

  it.each(cases)("%s emits a canonical for its own path", async (_name, path) => {
    const seo = await fetchRankMathSeo(path);

    const expected =
      normalizePath(path) === "/"
        ? "http://localhost:3000"
        : `http://localhost:3000${normalizePath(path)}`;
    expect(seo?.canonical).toBe(expected);
  });
});

describe("the mappings that shipped broken", () => {
  it("rejects the old blog post path instead of importing homepage metadata", async () => {
    const seo = await fetchRankMathSeo("/how-to-get-a-nursing-assistant-certification");

    expect(seo).toBeNull();
  });

  it("rejects the old course category path", async () => {
    // Under the mock this returns the homepage head. In production it returns a
    // canonical-less 404 head, which the guard cannot reject — the mapping is
    // the fix, the guard is the backstop.
    const seo = await fetchRankMathSeo("/course-category/first-aid-courses");

    expect(seo).toBeNull();
  });
});
