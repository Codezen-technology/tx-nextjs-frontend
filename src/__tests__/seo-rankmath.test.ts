import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import { fetchRankMathSeo, canonicalize } from "@/lib/seo/server";
import { wpPath } from "@/lib/seo/wp-paths";

import courseHead from "@/lib/seo/__fixtures__/course-head.json";
import homepageHead from "@/lib/seo/__fixtures__/homepage-head.json";
import notFoundHead from "@/lib/seo/__fixtures__/not-found-head.json";
import noindexHead from "@/lib/seo/__fixtures__/noindex-head.json";

/**
 * Fixtures are captured verbatim from production, so their URLs carry the real
 * WordPress origin. The test env sets NEXT_PUBLIC_WP_API_URL=http://localhost,
 * so rewrite the origin to make `toFrontendUrl` actually fire — without editing
 * the fixtures, which stay honest records of what Rank Math returns.
 */
const PROD_ORIGIN = "https://trainingexcellence.org.uk";
const TEST_WP_ORIGIN = "http://localhost";

function rehost(fixture: { head: string }): string {
  return fixture.head.split(PROD_ORIGIN).join(TEST_WP_ORIGIN);
}

/** Serve one fixture for every getHead request, regardless of the url param. */
function serveFixture(fixture: { head: string }) {
  server.use(
    http.get(`${TEST_WP_ORIGIN}/wp-json/rankmath/v1/getHead`, () =>
      HttpResponse.json({ success: true, head: rehost(fixture) }),
    ),
  );
}

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

describe("fetchRankMathSeo — payload matches the requested page", () => {
  it("uses Rank Math values when the canonical matches the request", async () => {
    serveFixture(courseHead);

    const seo = await fetchRankMathSeo(wpPath.course("health-and-safety-officer-training"));

    expect(seo).not.toBeNull();
    expect(seo?.title).toBe("Health and Safety Officer Training - Free CPD Certificate");
    expect(seo?.description).toContain("Ensure workplace safety");
    expect(warn).not.toHaveBeenCalled();
  });

  it("rewrites the canonical onto the frontend origin", async () => {
    serveFixture(courseHead);

    const seo = await fetchRankMathSeo(wpPath.course("health-and-safety-officer-training"));

    expect(seo?.canonical).toBe("http://localhost:3000/course/health-and-safety-officer-training");
  });

  it("strips the trailing slash WordPress serves", async () => {
    serveFixture(courseHead);

    const seo = await fetchRankMathSeo(wpPath.course("health-and-safety-officer-training"));

    expect(seo?.canonical?.endsWith("/")).toBe(false);
  });

  it("matches regardless of trailing-slash form in the request", async () => {
    serveFixture(courseHead);

    const seo = await fetchRankMathSeo("/course/health-and-safety-officer-training");

    expect(seo).not.toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("fetchRankMathSeo — payload belongs to a different page", () => {
  it("returns null when Rank Math answers a course request with the homepage head", async () => {
    // The exact failure that shipped: an unrecognised URL yields 200 + homepage head.
    serveFixture(homepageHead);

    const seo = await fetchRankMathSeo(wpPath.course("health-and-safety-officer-training"));

    expect(seo).toBeNull();
  });

  it("warns with both paths so the mismatch is diagnosable in logs", async () => {
    serveFixture(homepageHead);

    await fetchRankMathSeo(wpPath.blogPost("some-post"));

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("requested /blog/some-post, got /"));
  });

  it("still accepts the homepage head for an actual homepage request", async () => {
    serveFixture(homepageHead);

    const seo = await fetchRankMathSeo(wpPath.home());

    expect(seo).not.toBeNull();
    expect(seo?.title).toBe("Training Excellence - Get Skilled, Get Certified");
  });

  it("preserves the bare origin as the homepage canonical", async () => {
    serveFixture(homepageHead);

    const seo = await fetchRankMathSeo(wpPath.home());

    expect(seo?.canonical).toBe("http://localhost:3000");
  });
});

describe("fetchRankMathSeo — payloads with no canonical", () => {
  it("keeps a noindex directive rather than discarding the payload", async () => {
    // Rank Math legitimately omits the canonical on a noindex page. Rejecting it
    // would publish an indexable page that WordPress says is not — see design D2.
    serveFixture(noindexHead);

    const seo = await fetchRankMathSeo(
      wpPath.blogPost("how-to-get-a-nursing-assistant-certification"),
    );

    expect(seo).not.toBeNull();
    expect(seo?.robots).toContain("noindex");
    expect(seo?.canonical).toBeUndefined();
  });

  it("leaves the canonical to the caller's fallback when absent", async () => {
    serveFixture(noindexHead);

    const seo = await fetchRankMathSeo(
      wpPath.blogPost("how-to-get-a-nursing-assistant-certification"),
    );

    expect(seo?.canonical).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it("accepts the bare 404 head, which the guard cannot detect", async () => {
    // Documents the known hole in D2: no canonical means nothing to compare.
    // The path mappings in wpPath are what keep this head from being requested.
    serveFixture(notFoundHead);

    const seo = await fetchRankMathSeo(wpPath.courseCategory("first-aid-courses"));

    expect(seo).not.toBeNull();
    expect(seo?.title).toBe("Training Excellence");
  });
});

describe("fetchRankMathSeo — transport failures", () => {
  it("returns null when the endpoint is unreachable", async () => {
    server.use(
      http.get(`${TEST_WP_ORIGIN}/wp-json/rankmath/v1/getHead`, () => HttpResponse.error()),
    );

    expect(await fetchRankMathSeo(wpPath.home())).toBeNull();
  });

  it("returns null when Rank Math reports failure", async () => {
    server.use(
      http.get(`${TEST_WP_ORIGIN}/wp-json/rankmath/v1/getHead`, () =>
        HttpResponse.json({ success: false }),
      ),
    );

    expect(await fetchRankMathSeo(wpPath.home())).toBeNull();
  });
});

describe("canonicalize", () => {
  it("strips a trailing slash", () => {
    expect(canonicalize("https://example.com/course/x/")).toBe("https://example.com/course/x");
  });

  it("leaves a slashless path untouched", () => {
    expect(canonicalize("https://example.com/course/x")).toBe("https://example.com/course/x");
  });

  it("collapses repeated trailing slashes", () => {
    expect(canonicalize("https://example.com/course/x///")).toBe("https://example.com/course/x");
  });

  it("reduces the root path to a bare origin", () => {
    expect(canonicalize("https://example.com/")).toBe("https://example.com");
  });

  it("retains the query string", () => {
    expect(canonicalize("https://example.com/list/?page=2")).toBe(
      "https://example.com/list?page=2",
    );
  });

  it("retains the hash", () => {
    expect(canonicalize("https://example.com/page/#section")).toBe(
      "https://example.com/page#section",
    );
  });

  it("passes a non-URL through unchanged rather than throwing", () => {
    expect(canonicalize("not a url")).toBe("not a url");
  });
});
