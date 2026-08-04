import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";

// next-intl/server resolves to its client build under vitest's jsdom
// environment, where getLocale() throws. The request-scoped locale is
// irrelevant to canonical construction, so stub it out.
vi.mock("next-intl/server", () => ({
  getLocale: async () => "en",
  setRequestLocale: () => {},
}));

const { generateMetadata } = await import("@/app/[locale]/(marketing)/course-cat/[slug]/page");

const WP = "http://localhost/wp-json";
const LMS = `${WP}/lms-backend/v1`;
const SITE = "http://localhost:3000";

function params(slug = "first-aid-courses") {
  return Promise.resolve({ locale: "en", slug });
}

function searchParams(page?: string | string[]) {
  return Promise.resolve(page === undefined ? {} : { page });
}

function canonicalOf(meta: Awaited<ReturnType<typeof generateMetadata>>): unknown {
  return meta.alternates?.canonical;
}

beforeEach(() => {
  server.use(
    http.get(`${LMS}/course-categories`, () =>
      HttpResponse.json({
        success: true,
        data: {
          items: [
            {
              id: 1,
              slug: "first-aid-courses",
              name: "First Aid",
              description: "First aid training.",
              count: 40,
            },
          ],
        },
      }),
    ),
    // Rank Math always answers with page 1's canonical — it has no notion of ?page=N.
    http.get(`${WP}/rankmath/v1/getHead`, () =>
      HttpResponse.json({
        success: true,
        head: `<title>First Aid Courses</title><link rel="canonical" href="http://localhost/course-cat/first-aid-courses/" />`,
      }),
    ),
  );
});

describe("paginated category canonicals", () => {
  it("emits the bare path when no page param is present", async () => {
    const meta = await generateMetadata({ params: params(), searchParams: searchParams() });

    expect(canonicalOf(meta)).toBe(`${SITE}/course-cat/first-aid-courses`);
  });

  it("emits the bare path for page=1", async () => {
    const meta = await generateMetadata({ params: params(), searchParams: searchParams("1") });

    expect(canonicalOf(meta)).toBe(`${SITE}/course-cat/first-aid-courses`);
  });

  it("self-references on page 2", async () => {
    // Canonicalising page 2 back to page 1 tells Google the deeper pages are
    // duplicates, which de-indexes every course past the first 30.
    const meta = await generateMetadata({ params: params(), searchParams: searchParams("2") });

    expect(canonicalOf(meta)).toBe(`${SITE}/course-cat/first-aid-courses?page=2`);
  });

  it("self-references on a deeper page", async () => {
    const meta = await generateMetadata({ params: params(), searchParams: searchParams("7") });

    expect(canonicalOf(meta)).toBe(`${SITE}/course-cat/first-aid-courses?page=7`);
  });

  it("does not let Rank Math's page-1 canonical override the paginated one", async () => {
    const meta = await generateMetadata({ params: params(), searchParams: searchParams("3") });

    expect(canonicalOf(meta)).not.toBe(`${SITE}/course-cat/first-aid-courses`);
  });

  it("keeps og:url aligned with the paginated canonical", async () => {
    const meta = await generateMetadata({ params: params(), searchParams: searchParams("2") });

    expect(meta.openGraph?.url).toBe(`${SITE}/course-cat/first-aid-courses?page=2`);
  });

  it("ignores a non-numeric page param", async () => {
    const meta = await generateMetadata({ params: params(), searchParams: searchParams("junk") });

    expect(canonicalOf(meta)).toBe(`${SITE}/course-cat/first-aid-courses`);
  });

  it("ignores a zero or negative page param", async () => {
    const meta = await generateMetadata({ params: params(), searchParams: searchParams("0") });

    expect(canonicalOf(meta)).toBe(`${SITE}/course-cat/first-aid-courses`);
  });

  it("takes the first value when the param repeats", async () => {
    const meta = await generateMetadata({
      params: params(),
      searchParams: searchParams(["4", "9"]),
    });

    expect(canonicalOf(meta)).toBe(`${SITE}/course-cat/first-aid-courses?page=4`);
  });

  it("still emits a paginated canonical when the category lookup fails", async () => {
    server.use(http.get(`${LMS}/course-categories`, () => HttpResponse.error()));

    const meta = await generateMetadata({ params: params(), searchParams: searchParams("2") });

    expect(canonicalOf(meta)).toBe(`${SITE}/course-cat/first-aid-courses?page=2`);
  });
});
