import { describe, it, expect } from "vitest";
import { buildPageMetadata } from "@/lib/seo/server";
import type { ParsedSeo } from "@/lib/utils/seo";

const fallback = {
  title: "Fallback Title",
  description: "Fallback description for the page.",
  canonical: "https://example.com/page",
  image: "https://example.com/fallback.jpg",
};

function makeSeo(overrides: Partial<ParsedSeo> = {}): ParsedSeo {
  return {
    title: "RM Title",
    description: "RM description",
    canonical: "https://example.com/rm-page",
    ogType: "website",
    ogTitle: "RM OG Title",
    ogDescription: "RM OG Desc",
    ogImage: "https://cdn.example.com/rm.jpg",
    twitterTitle: "RM TW Title",
    twitterDescription: "RM TW Desc",
    twitterImage: "https://cdn.example.com/rm-tw.jpg",
    jsonLd: [],
    ...overrides,
  };
}

describe("buildPageMetadata", () => {
  it("uses fallback title when seo is null", () => {
    const meta = buildPageMetadata(null, fallback);
    expect(meta.title).toBe("Fallback Title");
  });

  it("prefers Rank Math title over fallback", () => {
    const meta = buildPageMetadata(makeSeo({ title: "RM Title" }), fallback);
    expect(meta.title).toBe("RM Title");
  });

  it("uses fallback description when seo is null", () => {
    const meta = buildPageMetadata(null, fallback);
    expect(meta.description).toBe("Fallback description for the page.");
  });

  it("prefers Rank Math description over fallback", () => {
    const meta = buildPageMetadata(makeSeo({ description: "RM desc" }), fallback);
    expect(meta.description).toBe("RM desc");
  });

  it("always sets canonical from Rank Math when present", () => {
    const meta = buildPageMetadata(makeSeo({ canonical: "https://example.com/rm" }), fallback);
    expect(meta.alternates?.canonical).toBe("https://example.com/rm");
  });

  it("falls back to provided canonical when seo is null", () => {
    const meta = buildPageMetadata(null, fallback);
    expect(meta.alternates?.canonical).toBe("https://example.com/page");
  });

  it("includes robots only when Rank Math provides it", () => {
    const withRobots = buildPageMetadata(makeSeo({ robots: "noindex" }), fallback);
    expect(withRobots.robots).toBe("noindex");

    const withoutRobots = buildPageMetadata(null, fallback);
    expect(withoutRobots.robots).toBeUndefined();
  });

  it("defaults og type to website when seo is null", () => {
    const meta = buildPageMetadata(null, fallback);
    expect((meta.openGraph as Record<string, unknown>)?.type).toBe("website");
  });

  it("uses Rank Math og:type when provided", () => {
    const meta = buildPageMetadata(makeSeo({ ogType: "article" }), fallback);
    expect((meta.openGraph as Record<string, unknown>)?.type).toBe("article");
  });

  it("twitter card is always summary_large_image", () => {
    const t1 = buildPageMetadata(null, fallback).twitter as Record<string, unknown> | undefined;
    const t2 = buildPageMetadata(makeSeo(), fallback).twitter as
      | Record<string, unknown>
      | undefined;
    expect(t1?.card).toBe("summary_large_image");
    expect(t2?.card).toBe("summary_large_image");
  });

  it("uses fallback image when seo has no og:image", () => {
    const meta = buildPageMetadata(makeSeo({ ogImage: undefined }), {
      ...fallback,
      image: "https://example.com/fallback.jpg",
    });
    expect(meta.openGraph?.images).toContain("https://example.com/fallback.jpg");
  });

  it("prefers Rank Math og:image over fallback", () => {
    const meta = buildPageMetadata(
      makeSeo({ ogImage: "https://cdn.example.com/rm.jpg" }),
      fallback,
    );
    expect(meta.openGraph?.images).toContain("https://cdn.example.com/rm.jpg");
  });

  it("omits description fields when both seo and fallback description are absent", () => {
    const meta = buildPageMetadata(makeSeo({ description: undefined }), {
      title: "Title Only",
      canonical: "https://example.com/",
    });
    expect(meta.description).toBeUndefined();
  });
});
