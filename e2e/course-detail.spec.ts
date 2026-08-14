import { test, expect } from "@playwright/test";

let courseSlug: string | null = null;

test.beforeAll(async () => {
  try {
    // Discover a real course slug from the WP API at runtime so tests aren't
    // hardcoded to a slug that may not exist on every dev environment.
    const base = process.env.NEXT_PUBLIC_WP_API_URL ?? "http://localhost";
    const res = await fetch(`${base}/wp-json/lms-backend/v1/courses?per_page=1`);
    if (res.ok) {
      const body = (await res.json()) as {
        data?: { items?: { slug: string }[] };
        items?: { slug: string }[];
      };
      const items = body.data?.items ?? body.items ?? [];
      courseSlug = items[0]?.slug ?? null;
    }
  } catch {
    courseSlug = null;
  }
});

test.describe("Course detail page", () => {
  test("renders with correct page title", async ({ page }) => {
    test.skip(!courseSlug, "No courses available on WP backend");
    const response = await page.goto(`/course/${courseSlug}`);
    expect(response?.status()).toBe(200);
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title).not.toBe("Course");
  });

  test("has a canonical link pointing to the frontend domain", async ({ page }) => {
    test.skip(!courseSlug, "No courses available on WP backend");
    await page.goto(`/course/${courseSlug}`);
    // Wait for client-side hydration to settle so head tags are stable
    await page.waitForSelector('link[rel="canonical"]', { timeout: 10_000 });
    const canonical = await page.evaluate(
      () => document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
    );
    expect(canonical).toBeTruthy();
    expect(canonical).not.toContain(process.env.NEXT_PUBLIC_WP_API_URL ?? "trainingexcellence");
    expect(canonical).toContain(`/course/${courseSlug}`);
  });

  test("injects valid JSON-LD structured data", async ({ page }) => {
    test.skip(!courseSlug, "No courses available on WP backend");
    await page.goto(`/course/${courseSlug}`);
    // JSON-LD is rendered in the page body by CourseDetailPage (not via generateMetadata)
    await page.waitForSelector('script[type="application/ld+json"]', { timeout: 10_000 });
    const scripts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
        (s) => s.textContent,
      ),
    );
    expect(scripts.length).toBeGreaterThan(0);
    expect(() => JSON.parse(scripts[0] ?? "")).not.toThrow();
  });

  test("unknown slug returns 404", async ({ page }) => {
    const response = await page.goto("/course/this-course-does-not-exist-xyz-abc-999");
    expect(response?.status()).toBe(404);
  });
});

/**
 * Rows from the QA report's Single Course section — `docs/qa/QA_BY_PAGE.md`.
 * Measurements behind each expected value are in `.context/figma/targets.md`
 * under "Single Course page".
 */
/**
 * Hover the element where it currently sits and read a computed colour.
 *
 * Re-aiming the pointer on every read matters: `transition-colors` means the
 * first frame after a hover still reports the resting value, and any layout
 * shift between polls can slide the element out from under a pointer that was
 * parked once. Both together produced a test that passed alone and failed under
 * parallel load.
 */
async function hoverAndRead(
  locator: import("@playwright/test").Locator,
  property: "backgroundColor" | "color" = "backgroundColor",
): Promise<string> {
  // `hover()` rather than a raw mouse.move: it scrolls the element into view first,
  // so the pointer lands on it even when the section starts below the fold.
  await locator.hover();
  return locator.evaluate((el, prop) => getComputedStyle(el)[prop as "backgroundColor"], property);
}

test.describe("QA-COURSE-* — single course page fidelity", () => {
  test("QA-COURSE-A2: no breadcrumb bar renders, BreadcrumbList JSON-LD survives", async ({
    page,
  }) => {
    test.skip(!courseSlug, "No courses available on WP backend");
    await page.goto(`/course/${courseSlug}`);

    const breadcrumbNav = page.locator(
      'nav[aria-label="Breadcrumb" i], nav[aria-label="Breadcrumbs" i], [role="navigation"][aria-label*="readcrumb" i]',
    );
    expect(
      await breadcrumbNav.count(),
      "single course @all: breadcrumb nav — expected 0 elements, found a visible breadcrumb bar",
    ).toBe(0);

    const types = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .flatMap((s) => {
          try {
            const parsed = JSON.parse(s.textContent ?? "");
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return [];
          }
        })
        .map((o) => (o as { "@type"?: string })["@type"]),
    );
    expect(
      types,
      `single course @all: JSON-LD @types — expected BreadcrumbList, got ${types}`,
    ).toContain("BreadcrumbList");
  });

  test("QA-COURSE-A3: the curriculum lists lectures without durations", async ({ page }) => {
    test.skip(!courseSlug, "No courses available on WP backend");
    await page.goto(`/course/${courseSlug}`);

    const curriculum = page.locator("#curriculum");
    if ((await curriculum.count()) === 0) test.skip(true, "Course has no curriculum.");

    const expandAll = curriculum.getByRole("button", { name: /expand all sections/i });
    if ((await expandAll.count()) > 0) await expandAll.click();

    const text = (await curriculum.innerText()).replace(/\s+/g, " ");
    const duration = text.match(/\b\d+\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/i);
    expect(
      duration?.[0] ?? null,
      `single course @all: curriculum duration text — expected none, found "${duration?.[0]}"`,
    ).toBeNull();
    expect(text, "single course @all: curriculum lecture counts — expected retained").toMatch(
      /lecture/i,
    );
  });

  test("QA-COURSE-A4: the FAQ toggle responds to hover", async ({ page }, testInfo) => {
    test.skip(!courseSlug, "No courses available on WP backend");
    // Hover is a pointer affordance; the 440 project emulates touch, where it never fires.
    test.skip(testInfo.project.name === "mobile-440", "Touch emulation has no hover state");
    await page.goto(`/course/${courseSlug}`);

    const faq = page.locator("#faq");
    if ((await faq.count()) === 0) test.skip(true, "Course has no FAQ section.");

    const toggle = faq.locator("button[aria-expanded]").first();
    const resting = await toggle.evaluate((el) => getComputedStyle(el).backgroundColor);
    await expect
      .poll(() => hoverAndRead(toggle), {
        message: `single course @all: FAQ toggle background on hover — expected a change from ${resting}`,
      })
      .not.toBe(resting);
  });

  test("QA-COURSE-A5: both purchase tabs respond to hover in both states", async ({
    page,
  }, testInfo) => {
    test.skip(!courseSlug, "No courses available on WP backend");
    test.skip(testInfo.project.name === "mobile-440", "Touch emulation has no hover state");
    await page.goto(`/course/${courseSlug}`);

    // The purchase card renders twice — once for mobile, once in the desktop
    // sidebar — so a bare `.first()` can land on the copy hidden at this width.
    const tabFor = (name: RegExp) =>
      page.getByRole("button", { name }).locator("visible=true").first();
    const restingBg = (name: RegExp) =>
      tabFor(name).evaluate((el) => getComputedStyle(el).backgroundColor);

    for (const name of [/^For me$/i, /^For teams$/i]) {
      const tab = tabFor(name);
      if ((await tab.count()) === 0) test.skip(true, "Course has no purchase card.");

      // Inactive (or currently-selected) state as it sits
      await page.mouse.move(0, 0);
      const resting = await restingBg(name);
      await expect
        .poll(() => hoverAndRead(tabFor(name)), {
          message: `single course @all: "${name.source}" tab hover — expected a change from ${resting}`,
        })
        .not.toBe(resting);

      // Now select it and hover again — the active tab must answer the pointer too
      await tab.click();
      await page.mouse.move(0, 0);
      const restingActive = await restingBg(name);
      await expect
        .poll(() => hoverAndRead(tabFor(name)), {
          message: `single course @all: "${name.source}" tab active hover — expected a change from ${restingActive}`,
        })
        .not.toBe(restingActive);
    }
  });

  test("QA-COURSE-A6: Related Courses uses the page's section-heading token", async ({ page }) => {
    test.skip(!courseSlug, "No courses available on WP backend");
    await page.goto(`/course/${courseSlug}`);

    const related = page.getByRole("heading", { name: /related courses/i }).first();
    if ((await related.count()) === 0) test.skip(true, "Course has no related courses.");
    await related.scrollIntoViewIfNeeded();

    const read = (loc: typeof related) =>
      loc.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          family: cs.fontFamily.split(",")[0].replace(/["']/g, ""),
          size: cs.fontSize,
          weight: cs.fontWeight,
          lineHeight: cs.lineHeight,
        };
      });

    const peer = page.getByRole("heading", { name: /course curriculum/i }).first();
    if ((await peer.count()) === 0) test.skip(true, "Course has no curriculum heading to compare.");

    const [relatedStyle, peerStyle] = [await read(related), await read(peer)];
    expect(
      relatedStyle,
      `single course @all: Related Courses heading token — expected ${JSON.stringify(peerStyle)}, observed ${JSON.stringify(relatedStyle)}`,
    ).toEqual(peerStyle);
  });

  test("QA-COURSE-A7: the prose list marker clears the 3:1 non-text contrast floor", async ({
    page,
  }) => {
    test.skip(!courseSlug, "No courses available on WP backend");
    await page.goto(`/course/${courseSlug}`);

    const measured = await page.evaluate(() => {
      const li = document.querySelector(".prose-wp li");
      if (!li) return null;
      const nums = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
      const before = getComputedStyle(li, "::before");
      const marker = nums(before.backgroundColor).slice(0, 3);
      const alpha = parseFloat(before.opacity);

      let node: Element | null = li;
      let bg = [255, 255, 255];
      while (node && node !== document.documentElement) {
        const parsed = nums(getComputedStyle(node).backgroundColor);
        if (parsed.length >= 3 && (parsed[3] === undefined || parsed[3] > 0)) {
          bg = parsed.slice(0, 3);
          break;
        }
        node = node.parentElement;
      }

      const effective = marker.map((c, i) => c * alpha + bg[i] * (1 - alpha));
      const lum = ([r, g, b]: number[]) => {
        const f = (v: number) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const [l1, l2] = [lum(effective), lum(bg)].sort((a, b) => b - a);
      return { ratio: +((l1 + 0.05) / (l2 + 0.05)).toFixed(2), effective, bg };
    });

    if (!measured) test.skip(true, "Course has no prose content with a list.");
    expect(
      measured!.ratio,
      `single course @all: prose list-marker contrast — expected >= 3, observed ${measured!.ratio} (marker rgb(${measured!.effective.map(Math.round)}) on rgb(${measured!.bg}))`,
    ).toBeGreaterThanOrEqual(3);
  });

  test("QA-COURSE-B3: no rating renders unless the course carries one", async ({ page }) => {
    test.skip(!courseSlug, "No courses available on WP backend");

    const readRating = async (path: string, scope: string) => {
      await page.goto(path);
      return page.evaluate((sel) => {
        const root = document.querySelector(sel);
        if (!root) return null;
        // "4.8" / "4.8 (12 Reviews)" — the numeric claim, wherever it sits
        const m = (root as HTMLElement).innerText.match(/\b[0-5]\.\d\b/);
        return m ? m[0] : null;
      }, scope);
    };

    const api = process.env.NEXT_PUBLIC_WP_API_URL ?? "http://localhost";
    const res = await fetch(`${api}/wp-json/lms-backend/v1/courses?per_page=1&slug=${courseSlug}`);
    const body = (await res.json()) as { data?: { items?: Record<string, unknown>[] } };
    const raw = body.data?.items?.[0] ?? {};
    const hasRating = Number(raw.rating_count ?? 0) > 0;

    const detail = await readRating(`/course/${courseSlug}`, "header, section");
    if (!hasRating) {
      expect(
        detail,
        `single course @all: detail header rating with no rating data — expected none, observed "${detail}"`,
      ).toBeNull();
    }

    const card = await readRating("/all-courses", "main");
    if (!hasRating) {
      expect(
        card,
        `all courses @all: card rating with no rating data — expected none, observed "${card}". A card must not invent a rating the course does not have`,
      ).toBeNull();
    } else {
      expect(card, `card vs detail rating — expected the same string`).toBe(detail);
    }
  });
});
