import { test, expect } from "@playwright/test";
import { decodeEntities } from "../src/lib/api/parsers";

/**
 * QA-BLOGS-* — single blog post rows.
 *
 * Targets in `.context/figma/targets.md` under "Single Blog page", measured from
 * `6015:127141`. Note the `A6` heading token is the **frame's** 20px SUSE Bold,
 * not the report's 32px — the contradiction is recorded on the row.
 */

/** A post with a featured image: the duplicate-image rows are unobservable without one. */
let slug: string | null = null;
let featuredSrc: string | null = null;

test.beforeAll(async () => {
  try {
    const base = process.env.NEXT_PUBLIC_WP_API_URL ?? "http://localhost";
    const res = await fetch(
      `${base}/wp-json/wp/v2/posts?per_page=20&_fields=slug,featured_media,categories`,
    );
    if (!res.ok) return;
    const posts = (await res.json()) as {
      slug: string;
      featured_media: number;
      categories: number[];
    }[];
    slug = posts.find((p) => p.featured_media)?.slug ?? null;
  } catch {
    slug = null;
  }
});

/** `next/image` rewrites srcs — compare on the underlying upload path. */
const uploadPath = (src: string) => {
  const decoded = decodeURIComponent(src.replace(/^.*[?&]url=/, "").split("&")[0]);
  return decoded.replace(/^https?:\/\/[^/]+/, "").replace(/-\d+x\d+(?=\.\w+$)/, "");
};

test.describe("QA-BLOGS-* — single blog post", () => {
  // Each test navigates a route the dev server may still be compiling, and four
  // of them run in parallel against one server. The default budget is not enough.
  test.beforeEach(() => test.slow());

  test("QA-BLOGS-A4: the featured image renders once, in the hero", async ({ page }) => {
    test.skip(!slug, "No post with a featured image on this backend");
    await page.goto(`/blog/${slug}`);

    const shots = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img")).map((i) => ({
        src: i.currentSrc || i.src,
        inArticle: !!i.closest("article"),
        inHero: !!i.closest("section"),
      })),
    );

    const hero = shots.find((s) => s.inHero && !s.inArticle);
    expect(hero, "single blog: expected a hero image").toBeTruthy();
    featuredSrc = uploadPath(hero!.src);

    const repeats = shots.filter((s) => s.inArticle && uploadPath(s.src) === featuredSrc);
    expect(
      repeats.length,
      `single blog: the featured image ${featuredSrc} is repeated in the article column — the frame's rich-text column opens with text (6015:127203)`,
    ).toBe(0);
  });

  test("QA-BLOGS-A4: images inside the post body still render", async ({ page }) => {
    test.skip(!slug, "No post with a featured image on this backend");
    await page.goto(`/blog/${slug}`);

    const contentImages = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("article .prose-wp img")).filter((i) => {
          const r = i.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }).length,
    );
    // Not every post has body images; when one does, removing the header image
    // must not have taken them with it.
    if (contentImages === 0) test.skip(true, "This post's body has no images.");
    expect(contentImages, "single blog: post body images must survive").toBeGreaterThan(0);
  });

  test("QA-BLOGS-A6: article headings use the measured SUSE Bold 20 token", async ({ page }) => {
    test.skip(!slug, "No post with a featured image on this backend");
    await page.goto(`/blog/${slug}`);

    const h2 = page.locator("article .prose-wp h2").first();
    if ((await h2.count()) === 0) test.skip(true, "This post's body has no headings.");

    const style = await h2.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        family: cs.fontFamily.split(",")[0].replace(/["']/g, ""),
        size: cs.fontSize,
        weight: cs.fontWeight,
        lineHeight: cs.lineHeight,
      };
    });

    expect(
      style,
      `single blog @all: article heading token — expected SUSE 20px/700/24px (Heading/Bold/H5 on 6015:127252), observed ${JSON.stringify(style)}`,
    ).toEqual({ family: "SUSE", size: "20px", weight: "700", lineHeight: "24px" });
  });

  test("QA-BLOGS-A6: body copy stays Open Sans 16/400/24", async ({ page }) => {
    test.skip(!slug, "No post with a featured image on this backend");
    await page.goto(`/blog/${slug}`);

    const p = page.locator("article .prose-wp p").first();
    const style = await p.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { size: cs.fontSize, weight: cs.fontWeight, lineHeight: cs.lineHeight };
    });

    expect(
      style,
      `single blog @all: body token — expected 16px/400/24px (Body/Regular), observed ${JSON.stringify(style)}`,
    ).toEqual({ size: "16px", weight: "400", lineHeight: "24px" });
  });

  test("QA-BLOGS-A6: the heading token does not leak to other prose surfaces", async ({ page }) => {
    // The scoping is the point: `prose-wp` also serves legal pages and course
    // copy, which were never measured against the blog frame.
    await page.goto("/privacy-policy");
    const h2 = page.locator(".prose-wp h2").first();
    if ((await h2.count()) === 0) test.skip(true, "No prose headings on the privacy page.");

    const size = await h2.evaluate((el) => getComputedStyle(el).fontSize);
    expect(
      size,
      `privacy policy: prose heading size — expected the shared 24px, observed ${size}. The blog token must not leak`,
    ).toBe("24px");
  });

  test("QA-BLOGS-A3: the rendered category is the post's own", async ({ page }) => {
    test.skip(!slug, "No post with a featured image on this backend");
    await page.goto(`/blog/${slug}`);

    const base = process.env.NEXT_PUBLIC_WP_API_URL ?? "http://localhost";
    const post = (await (
      await fetch(`${base}/wp-json/wp/v2/posts?slug=${slug}&_fields=categories`)
    ).json()) as { categories: number[] }[];
    const firstCategory = post[0]?.categories?.[0];
    if (!firstCategory) test.skip(true, "Post has no category.");

    const cat = (await (
      await fetch(`${base}/wp-json/wp/v2/categories/${firstCategory}?_fields=name`)
    ).json()) as { name: string };

    // WP hands back the name with its entities still encoded. Comparing the two
    // raw strings is what let this row close while the page was printing a
    // literal "&amp;" — the expectation has to be the decoded name.
    const expected = decodeEntities(cat.name);
    const rendered = await page.locator('a[href^="/blog/category/"]').first().innerText();

    expect(
      rendered.trim(),
      `single blog: category label — expected the post's own category "${expected}", observed "${rendered.trim()}"`,
    ).toBe(expected);
    expect(
      rendered,
      `single blog: category label — an HTML entity reached the page verbatim: "${rendered.trim()}"`,
    ).not.toMatch(/&(?:[a-z]+|#\d+);/i);
  });

  test("QA-BLOGS-D1: at 440 the ToC is a bottom drawer that opens and jumps", async ({ page }) => {
    test.skip(!slug, "No post with a featured image on this backend");
    await page.setViewportSize({ width: 440, height: 900 });
    await page.goto(`/blog/${slug}`);

    const trigger = page.getByRole("button", { name: /Table of Contents/i }).first();
    if (!(await trigger.isVisible().catch(() => false)))
      test.skip(true, "Post has no multi-heading Table of Contents.");

    // Anchored to the bottom edge of the viewport, not laid out in the article.
    const box = (await trigger.boundingBox())!;
    expect(
      900 - (box.y + box.height),
      "single blog @440: the ToC trigger should sit on the bottom edge of the screen",
    ).toBeLessThan(40);
    await expect(
      page.locator('[data-toc-surface="rail"]'),
      "single blog @440: the desktop ToC rail should not render",
    ).toBeHidden();

    await trigger.click();
    const panel = page.getByRole("dialog", { name: /Table of contents/i });
    await expect(panel).toBeVisible();
    expect(
      await panel.evaluate((e) => getComputedStyle(e.parentElement!).position),
      "single blog @440: the open ToC should float over the page, not push it",
    ).toBe("fixed");

    const link = panel.locator("[data-toc-link]").first();
    const id = await link.getAttribute("data-toc-link");
    await link.click();
    await expect(panel).toBeHidden();
    await page.waitForFunction(
      (target) => {
        const el = document.getElementById(target!);
        return !!el && Math.abs(el.getBoundingClientRect().top - 96) < 4;
      },
      id,
      { timeout: 5_000 },
    );
  });

  test("QA-BLOGS-A8: 128px side padding at 1280", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "The 128 ramp step is specific to 1280");
    test.skip(!slug, "No post with a featured image on this backend");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/blog/${slug}`);

    const padding = await page.evaluate(() => {
      const hero = document.querySelector("section .container");
      const header = document.querySelector("header")?.firstElementChild;
      const read = (el: Element | null | undefined) =>
        el ? getComputedStyle(el).paddingLeft : null;
      return { hero: read(hero), header: read(header) };
    });

    expect(
      padding,
      `single blog @1280: side padding — expected 128px on hero and header (page-grid ramp), observed ${JSON.stringify(padding)}`,
    ).toEqual({ hero: "128px", header: "128px" });
  });
});
