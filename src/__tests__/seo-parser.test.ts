import { describe, it, expect } from "vitest";
import { parseRankMathHead } from "@/lib/utils/seo";
import { makeRankMathHead } from "./fixtures/courses";

describe("parseRankMathHead", () => {
  it("extracts title", () => {
    const html = makeRankMathHead({ title: "My Course — Training Excellence" });
    expect(parseRankMathHead(html).title).toBe("My Course — Training Excellence");
  });

  it("extracts description from meta name", () => {
    const html = `<meta name="description" content="Great course" />`;
    expect(parseRankMathHead(html).description).toBe("Great course");
  });

  it("extracts canonical href", () => {
    const html = `<link rel="canonical" href="https://example.com/course/slug" />`;
    expect(parseRankMathHead(html).canonical).toBe("https://example.com/course/slug");
  });

  it("handles canonical with href before rel attribute", () => {
    const html = `<link href="https://example.com/course/slug" rel="canonical" />`;
    expect(parseRankMathHead(html).canonical).toBe("https://example.com/course/slug");
  });

  it("handles meta with content before name attribute", () => {
    const html = `<meta content="index,follow" name="robots" />`;
    expect(parseRankMathHead(html).robots).toBe("index,follow");
  });

  it("extracts og:type", () => {
    const html = `<meta property="og:type" content="article" />`;
    expect(parseRankMathHead(html).ogType).toBe("article");
  });

  it("extracts og:locale", () => {
    const html = `<meta property="og:locale" content="en_GB" />`;
    expect(parseRankMathHead(html).ogLocale).toBe("en_GB");
  });

  it("extracts og:title and og:description", () => {
    const html = [
      `<meta property="og:title" content="OG Title" />`,
      `<meta property="og:description" content="OG Desc" />`,
    ].join("\n");
    const seo = parseRankMathHead(html);
    expect(seo.ogTitle).toBe("OG Title");
    expect(seo.ogDescription).toBe("OG Desc");
  });

  it("extracts og:image", () => {
    const html = `<meta property="og:image" content="https://cdn.example.com/img.jpg" />`;
    expect(parseRankMathHead(html).ogImage).toBe("https://cdn.example.com/img.jpg");
  });

  it("extracts twitter:title, twitter:description, twitter:image", () => {
    const html = [
      `<meta name="twitter:title" content="TW Title" />`,
      `<meta name="twitter:description" content="TW Desc" />`,
      `<meta name="twitter:image" content="https://cdn.example.com/tw.jpg" />`,
    ].join("\n");
    const seo = parseRankMathHead(html);
    expect(seo.twitterTitle).toBe("TW Title");
    expect(seo.twitterDescription).toBe("TW Desc");
    expect(seo.twitterImage).toBe("https://cdn.example.com/tw.jpg");
  });

  it("extracts a single JSON-LD block", () => {
    const schema = { "@type": "Course", name: "Test" };
    const html = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
    const seo = parseRankMathHead(html);
    expect(seo.jsonLd).toHaveLength(1);
    expect(seo.jsonLd[0]).toMatchObject({ "@type": "Course", name: "Test" });
  });

  it("extracts multiple JSON-LD blocks", () => {
    const html = [
      `<script type="application/ld+json">{"@type":"WebPage"}</script>`,
      `<script type="application/ld+json">{"@type":"Course","name":"X"}</script>`,
    ].join("\n");
    expect(parseRankMathHead(html).jsonLd).toHaveLength(2);
  });

  it("skips malformed JSON-LD and keeps valid blocks", () => {
    const html = [
      `<script type="application/ld+json">NOT JSON</script>`,
      `<script type="application/ld+json">{"@type":"WebPage"}</script>`,
    ].join("\n");
    const result = parseRankMathHead(html);
    expect(result.jsonLd).toHaveLength(1);
    expect(result.jsonLd[0]).toMatchObject({ "@type": "WebPage" });
  });

  it("returns empty jsonLd array when no JSON-LD present", () => {
    expect(parseRankMathHead("<title>Test</title>").jsonLd).toEqual([]);
  });

  it("returns all undefined fields on empty string", () => {
    const seo = parseRankMathHead("");
    expect(seo.title).toBeUndefined();
    expect(seo.description).toBeUndefined();
    expect(seo.canonical).toBeUndefined();
    expect(seo.ogType).toBeUndefined();
    expect(seo.jsonLd).toEqual([]);
  });
});
