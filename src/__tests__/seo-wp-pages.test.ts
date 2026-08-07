import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import { isServableWpPage, isIndexableWpPage, isCatchAllSlug } from "@/lib/seo/wp-pages";

/**
 * What the WordPress catch-all route will and will not serve.
 *
 * `/shop` shipped as a soft 404: HTTP 200, the title "Page Not Found", and an
 * indexable robots directive, advertised in the sitemap. The page endpoint
 * cannot distinguish it from `/training-teams` — both report empty `content`
 * and `blocks`, because Elementor content is not exposed there — so the Rank
 * Math canonical is the deciding signal.
 */

const WP = "http://localhost";

/** Paths WordPress publishes; anything else gets the 404 head. */
const PUBLISHED: Record<string, string> = {
  "/training-teams": "/training-teams/",
  "/resources": "/resources/",
  "/home": "/", // canonicalises to the site root, not to itself
};

function mockRankMath() {
  server.use(
    http.get(`${WP}/wp-json/rankmath/v1/getHead`, ({ request }) => {
      const asked = new URL(request.url).searchParams.get("url") ?? "";
      const pathname = new URL(asked).pathname.replace(/\/$/, "") || "/";
      const canonical = PUBLISHED[pathname];

      const head = canonical
        ? `<title>Page</title><link rel="canonical" href="${WP}${canonical}" />`
        : `<title>Page Not Found - Training Excellence</title><meta name="robots" content="follow, noindex"/>`;

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

describe("isServableWpPage", () => {
  it("serves an Elementor page: no content, no blocks, but a canonical", () => {
    // /training-teams — the case that makes an emptiness check alone wrong.
    expect(isServableWpPage({ content: "", blocks: [] }, `${WP}/training-teams/`)).toBe(true);
  });

  it("refuses a page with no content, no blocks and no canonical", () => {
    // /shop — WordPress answers 200, Rank Math answers with a 404 head.
    expect(isServableWpPage({ content: "", blocks: [] }, undefined)).toBe(false);
  });

  it("serves a page with real content even when Rank Math says nothing", () => {
    expect(isServableWpPage({ content: "<p>Real copy</p>", blocks: [] }, undefined)).toBe(true);
  });

  it("serves a block-composed page even when Rank Math says nothing", () => {
    expect(isServableWpPage({ content: "", blocks: [{ type: "hero" }] }, undefined)).toBe(true);
  });

  it("treats whitespace-only content as no content", () => {
    expect(isServableWpPage({ content: "   \n  ", blocks: [] }, undefined)).toBe(false);
  });

  it("tolerates a page object missing both fields", () => {
    expect(isServableWpPage({}, undefined)).toBe(false);
  });
});

describe("isIndexableWpPage", () => {
  it("accepts a page WordPress publishes at that path", async () => {
    await expect(isIndexableWpPage("training-teams")).resolves.toBe(true);
    await expect(isIndexableWpPage("resources")).resolves.toBe(true);
  });

  it("rejects a path WordPress answers for with a 404 head", async () => {
    await expect(isIndexableWpPage("shop")).resolves.toBe(false);
  });

  it("rejects a page whose canonical points somewhere else", async () => {
    // /home carries the homepage's canonical — indexing it duplicates the root.
    await expect(isIndexableWpPage("home")).resolves.toBe(false);
  });

  it("rejects rather than throws when Rank Math is unreachable", async () => {
    server.use(http.get(`${WP}/wp-json/rankmath/v1/getHead`, () => HttpResponse.error()));

    await expect(isIndexableWpPage("training-teams")).resolves.toBe(false);
  });
});

describe("isCatchAllSlug", () => {
  it.each(["training-teams", "force-for-good", "resources", "write-for-us"])(
    "accepts %s",
    (slug) => {
      expect(isCatchAllSlug(slug)).toBe(true);
    },
  );

  it.each(["login", "register", "cart", "checkout", "business-dashboard", "about-us", "blog"])(
    "rejects %s — this app serves it with its own route",
    (slug) => {
      expect(isCatchAllSlug(slug)).toBe(false);
    },
  );

  it.each(["shop", "my-account", "student-portal", "course-player", "lostpassword"])(
    "rejects %s — WordPress-only, no frontend route",
    (slug) => {
      expect(isCatchAllSlug(slug)).toBe(false);
    },
  );
});
