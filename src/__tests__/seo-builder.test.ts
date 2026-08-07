import { describe, it, expect, vi } from "vitest";
import { buildPageMetadata, brandOnce } from "@/lib/seo/server";
import { parseRankMathHead } from "@/lib/utils/seo";
import productHead from "@/lib/seo/__fixtures__/product-head.json";
import type { ParsedSeo } from "@/lib/utils/seo";

// The builder resolves the site name from settings to brand the title once.
// Mocked so these stay pure unit tests with a known brand.
vi.mock("@/lib/services/settings.server", () => ({
  fetchSettings: vi.fn(async () => ({ site_name: "Training Excellence" })),
}));

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

/** `title` is now `{ absolute: string }` so the root layout template can't re-brand it. */
function titleOf(meta: { title?: unknown }): string | undefined {
  return (meta.title as { absolute?: string } | undefined)?.absolute;
}

describe("buildPageMetadata", () => {
  it("uses fallback title when seo is null", async () => {
    const meta = await buildPageMetadata(null, fallback);
    expect(titleOf(meta)).toBe("Fallback Title | Training Excellence");
  });

  it("prefers Rank Math title over fallback", async () => {
    const meta = await buildPageMetadata(makeSeo({ title: "RM Title" }), fallback);
    expect(titleOf(meta)).toBe("RM Title | Training Excellence");
  });

  it("uses fallback description when seo is null", async () => {
    const meta = await buildPageMetadata(null, fallback);
    expect(meta.description).toBe("Fallback description for the page.");
  });

  it("prefers Rank Math description over fallback", async () => {
    const meta = await buildPageMetadata(makeSeo({ description: "RM desc" }), fallback);
    expect(meta.description).toBe("RM desc");
  });

  it("always sets canonical from Rank Math when present", async () => {
    const meta = await buildPageMetadata(
      makeSeo({ canonical: "https://example.com/rm" }),
      fallback,
    );
    expect(meta.alternates?.canonical).toBe("https://example.com/rm");
  });

  it("falls back to provided canonical when seo is null", async () => {
    const meta = await buildPageMetadata(null, fallback);
    expect(meta.alternates?.canonical).toBe("https://example.com/page");
  });

  it("includes robots only when Rank Math provides it", async () => {
    const withRobots = await buildPageMetadata(makeSeo({ robots: "noindex" }), fallback);
    expect(withRobots.robots).toBe("noindex");

    const withoutRobots = await buildPageMetadata(null, fallback);
    expect(withoutRobots.robots).toBeUndefined();
  });

  it("defaults og type to website when seo is null", async () => {
    const meta = await buildPageMetadata(null, fallback);
    expect((meta.openGraph as Record<string, unknown>)?.type).toBe("website");
  });

  it("uses Rank Math og:type when provided", async () => {
    const meta = await buildPageMetadata(makeSeo({ ogType: "article" }), fallback);
    expect((meta.openGraph as Record<string, unknown>)?.type).toBe("article");
  });

  it("twitter card is always summary_large_image", async () => {
    const t1 = (await buildPageMetadata(null, fallback)).twitter as
      | Record<string, unknown>
      | undefined;
    const t2 = (await buildPageMetadata(makeSeo(), fallback)).twitter as
      | Record<string, unknown>
      | undefined;
    expect(t1?.card).toBe("summary_large_image");
    expect(t2?.card).toBe("summary_large_image");
  });

  it("uses fallback image when seo has no og:image", async () => {
    const meta = await buildPageMetadata(makeSeo({ ogImage: undefined }), {
      ...fallback,
      image: "https://example.com/fallback.jpg",
    });
    expect(meta.openGraph?.images).toContain("https://example.com/fallback.jpg");
  });

  it("prefers Rank Math og:image over fallback", async () => {
    const meta = await buildPageMetadata(
      makeSeo({ ogImage: "https://cdn.example.com/rm.jpg" }),
      fallback,
    );
    expect(meta.openGraph?.images).toContain("https://cdn.example.com/rm.jpg");
  });

  it("omits description fields when both seo and fallback description are absent", async () => {
    const meta = await buildPageMetadata(makeSeo({ description: undefined }), {
      title: "Title Only",
      canonical: "https://example.com/",
    });
    expect(meta.description).toBeUndefined();
  });
});

describe("unsupported Open Graph types", () => {
  it("keeps the whole head when Rank Math sends og:type=product", async () => {
    // Real production head for a WooCommerce product. Next rejects `product`,
    // and before the allowlist that rejection discarded every other field.
    const seo = parseRankMathHead(productHead.head);
    expect(seo.ogType).toBe("product");

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const meta = await buildPageMetadata(seo, {
      title: "Health and Safety Officer Training",
      description: "Fallback product description.",
      canonical: "https://example.com/product/health-and-safety-officer-training",
    });

    expect((meta.openGraph as Record<string, unknown>).type).toBe("website");
    expect(titleOf(meta)).toBe("Health and Safety Officer Training - Training Excellence");
    expect(meta.description).toBeTruthy();
    expect(meta.alternates?.canonical).toBe(
      "https://example.com/product/health-and-safety-officer-training",
    );
    expect(meta.robots).toBe(seo.robots);
    expect((meta.openGraph as Record<string, unknown>).title).toBeTruthy();
    expect((meta.twitter as Record<string, unknown>).card).toBe("summary_large_image");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("product"));
    warn.mockRestore();
  });

  it("falls back to website for any unmodelled type", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const meta = await buildPageMetadata(makeSeo({ ogType: "restaurant.menu" }), fallback);
    expect((meta.openGraph as Record<string, unknown>).type).toBe("website");
    warn.mockRestore();
  });

  it("passes a supported type through verbatim", async () => {
    const meta = await buildPageMetadata(makeSeo({ ogType: "video.movie" }), fallback);
    expect((meta.openGraph as Record<string, unknown>).type).toBe("video.movie");
  });
});

describe("brandOnce", () => {
  it("leaves an already-branded title alone", () => {
    expect(brandOnce("Animal Care Courses - Training Excellence", "Training Excellence")).toBe(
      "Animal Care Courses - Training Excellence",
    );
  });

  it("appends the brand exactly once to an unbranded title", () => {
    expect(brandOnce("Animal Care Courses", "Training Excellence")).toBe(
      "Animal Care Courses | Training Excellence",
    );
  });

  it("does not double a title that is the brand itself", () => {
    expect(brandOnce("Training Excellence", "Training Excellence")).toBe("Training Excellence");
  });

  it("matches the brand case-insensitively", () => {
    expect(brandOnce("Courses - TRAINING EXCELLENCE", "Training Excellence")).toBe(
      "Courses - TRAINING EXCELLENCE",
    );
  });

  it("decodes HTML entities that arrive from WordPress", () => {
    expect(brandOnce("Terms &amp; Conditions", "Training Excellence")).toBe(
      "Terms & Conditions | Training Excellence",
    );
  });

  it("returns the title unchanged when there is no site name", () => {
    expect(brandOnce("Some Page", "")).toBe("Some Page");
  });
});
