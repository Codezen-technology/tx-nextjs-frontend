import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * Verification for the Class B (functional) and Class C (image) fixes from the
 * QA report execution plan. Each test names the QA ID it covers so a failure
 * points straight back at the tracker row.
 *
 * These drive real pages against whatever `PLAYWRIGHT_BASE_URL` points at, so
 * anything that depends on catalogue content skips rather than fails when the
 * backend has none — a missing fixture is not a regression.
 */

/** First href on `listPath` matching `prefix`, or null when the backend has no content. */
async function firstLink(page: Page, listPath: string, prefix: string): Promise<string | null> {
  await page.goto(listPath);
  const link = page.locator(`a[href^="${prefix}"]`).first();
  if ((await link.count()) === 0) return null;
  return link.getAttribute("href");
}

const firstCoursePath = (page: Page) => firstLink(page, "/all-courses", "/course/");
const firstCategoryPath = (page: Page) => firstLink(page, "/all-courses", "/course-cat/");

async function firstBlogPostPath(page: Page): Promise<string | null> {
  await page.goto("/blog");
  const link = page.locator('a[href^="/blog/"]:not([href*="/blog/category/"])').first();
  if ((await link.count()) === 0) return null;
  return link.getAttribute("href");
}

async function firstCourseSlug(page: Page): Promise<string | null> {
  const href = await firstCoursePath(page);
  return href?.replace("/course/", "") ?? null;
}

test.describe("QA-HOME-* — homepage pricing quantity", () => {
  test("the displayed amount tracks the quantity stepper", async ({ page }) => {
    await page.goto("/");

    // Scope to a single plan: not every plan renders a stepper (the "navy"
    // variant has none), so taking the first price and the first stepper
    // independently can land on two different cards.
    const plan = page
      .getByTestId("plan-pricing")
      .filter({ has: page.getByRole("button", { name: /increase quantity/i }) })
      .first();
    if ((await plan.count()) === 0) test.skip(true, "No pricing plan with a quantity stepper.");

    const price = plan.getByTestId("plan-price");
    const before = (await price.textContent())?.trim() ?? "";
    expect(before).not.toBe("");

    await plan.getByRole("button", { name: /increase quantity/i }).click();
    await expect(price).not.toHaveText(before);
  });
});

/**
 * Asserts every *visible* CMS image under `scope` both decoded and occupies a
 * non-zero layout box — the two failure modes from the `cms-image-resilience`
 * spec, which are independent: a decodable source can still be collapsed by its
 * sizing, and a correctly sized box can still be empty.
 *
 * Images with a hidden ancestor are excluded. Several pages render a desktop and
 * a mobile copy of the same block behind `hidden lg:block` / `lg:hidden`, so the
 * inactive copy legitimately measures 0x0 — Single Course alone has 14 of them,
 * and counting those would make this assertion useless.
 */
async function assertImagesRender(page: Page, scope: Locator): Promise<number> {
  const images = scope.locator("img");
  const total = await images.count();
  let checked = 0;

  for (let i = 0; i < total; i++) {
    const img = images.nth(i);

    const hidden = await img.evaluate((el) => {
      for (let node: Element | null = el; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return true;
      }
      return false;
    });
    if (hidden) continue;

    const src = await img.getAttribute("src");

    // Box first, and read straight from the DOM. `scrollIntoViewIfNeeded` and
    // `toBeVisible` both block on a zero-size element, so checking those first
    // turns a collapsed image into an opaque timeout instead of a named failure.
    const size = await img.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height };
    });
    expect(size.w, `zero-width box: ${src}`).toBeGreaterThan(0);
    expect(size.h, `zero-height box: ${src}`).toBeGreaterThan(0);

    // Lazy by default — naturalWidth stays 0 until the image enters the viewport.
    await img.scrollIntoViewIfNeeded();
    await expect(img).toBeVisible();
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete), { timeout: 10_000 })
      .toBe(true);

    // naturalWidth is 0 for an image the browser could not decode.
    expect(
      await img.evaluate((el: HTMLImageElement) => el.naturalWidth),
      `failed to decode: ${src}`,
    ).toBeGreaterThan(0);

    checked += 1;
  }

  return checked;
}

/**
 * Surfaces covered by the image assertion. `path` may be resolved at run time
 * when it depends on catalogue content that a bare backend will not have.
 */
const IMAGE_SURFACES: {
  id: string;
  name: string;
  path: string | ((page: Page) => Promise<string | null>);
  scope?: (page: Page) => Locator;
}[] = [
  {
    id: "QA-HOME-C1/C2",
    name: "homepage certificate & transcript",
    path: "/",
    scope: (page) => page.locator("section", { hasText: /Certificate & Transcript/i }).last(),
  },
  { id: "QA-ABOUT-C1/C2", name: "About Us", path: "/about-us" },
  { id: "QA-CAT-C1/C2", name: "Category", path: firstCategoryPath },
  { id: "QA-BLOGS-C1", name: "Single Blog", path: firstBlogPostPath },
  { id: "QA-COURSE-C1", name: "Single Course", path: firstCoursePath },
];

test.describe("Class C — CMS images render at every reported width", () => {
  test.slow();

  for (const surface of IMAGE_SURFACES) {
    test(`${surface.id} — ${surface.name}`, async ({ page }) => {
      const path = typeof surface.path === "string" ? surface.path : await surface.path(page);
      if (!path) test.skip(true, `No content for ${surface.name}.`);

      await page.goto(path as string);

      const scope = surface.scope ? surface.scope(page) : page.locator("body");
      if ((await scope.count()) === 0) test.skip(true, `${surface.name} section not present.`);

      const checked = await assertImagesRender(page, scope);
      expect(checked, `no visible images found on ${surface.name}`).toBeGreaterThan(0);
    });
  }
});

/**
 * About Us ships with its image fields unset in production, so the page must
 * render its placeholder rather than a broken or collapsed slot. This is the
 * `about-us-page-content` spec's degradation path, and it is the reason the
 * surface above passes despite QA reporting "images are not visible".
 */
test.describe("QA-ABOUT-* — unset images degrade to the placeholder", () => {
  test("no broken or collapsed image slot on About Us", async ({ page }) => {
    await page.goto("/about-us");

    const broken = await page.evaluate(
      () =>
        [...document.querySelectorAll("img")].filter((el) => {
          for (let n: Element | null = el; n; n = n.parentElement) {
            const s = getComputedStyle(n);
            if (s.display === "none" || s.visibility === "hidden") return false;
          }
          const r = el.getBoundingClientRect();
          return (el.complete && el.naturalWidth === 0) || r.width === 0 || r.height === 0;
        }).length,
    );

    expect(broken).toBe(0);
  });
});

test.describe("QA-COURSE-* — buy CTA routes to the cart", () => {
  test.slow();

  test("'Buy this course' lands on /cart, not /checkout", async ({ page }) => {
    const slug = await firstCourseSlug(page);
    if (!slug) test.skip(true, "No courses in the catalogue.");

    await page.goto(`/course/${slug}`);
    const cta = page.getByRole("button", { name: /buy this course/i }).first();
    if ((await cta.count()) === 0) test.skip(true, "Course is not purchasable.");

    await cta.click();
    // Add-to-cart is a real round trip to WooCommerce; give it room.
    await page.waitForURL(/\/(cart|login)(\?|$)/, { timeout: 45_000 });
    expect(page.url()).not.toContain("/checkout");
  });
});

test.describe("QA-BLOGS-* — Table of Contents anchors", () => {
  test.slow();

  test("clicking a ToC entry scrolls the page to that heading", async ({ page, viewport }) => {
    // The rail is an `lg`-and-up surface. Below that the ToC is the bottom
    // drawer, covered by `blog-single.spec.ts > QA-BLOGS-D1`.
    test.skip((viewport?.width ?? 0) < 1024, "The ToC rail only renders from lg up");
    await page.goto("/blog");
    // Exclude /blog/category/* — those are listings, not articles.
    const hrefs = await page
      .locator('a[href^="/blog/"]:not([href*="/blog/category/"])')
      .evaluateAll((links) =>
        [...new Set(links.map((l) => l.getAttribute("href")).filter(Boolean as never))].slice(0, 8),
      );
    if (hrefs.length === 0) test.skip(true, "No blog posts published.");

    // Not every post has two or more h2s, and only those get a ToC.
    // Scope to the desktop rail: the mobile drawer (QA-BLOGS-D1) renders the same
    // links and is only display-hidden at this viewport, so an unscoped locator
    // matches each heading twice.
    const tocLinks = page.locator('[data-toc-surface="rail"] [data-toc-link]');
    let found = false;
    for (const href of hrefs) {
      await page.goto(href as string);
      if ((await tocLinks.count()) > 1) {
        found = true;
        break;
      }
    }
    if (!found) test.skip(true, "No post with a multi-heading Table of Contents.");

    const tocLink = tocLinks.nth(1);
    const id = await tocLink.getAttribute("data-toc-link");
    const before = await page.evaluate(() => window.scrollY);

    await tocLink.click();
    await page.waitForFunction((y) => window.scrollY > y + 50, before, { timeout: 5_000 });
    // Smooth scrolling is animated — measure only once it has settled.
    await page.waitForFunction(
      () =>
        new Promise((resolve) => {
          let last = window.scrollY;
          let still = 0;
          const tick = () => {
            if (window.scrollY === last) still += 1;
            else {
              still = 0;
              last = window.scrollY;
            }
            if (still >= 5) resolve(true);
            else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
      undefined,
      { timeout: 10_000 },
    );

    // The heading must end up on screen and clear of the header, not under it.
    // `CSS.escape` is a browser API — build the attribute selector instead, as
    // this line runs in Node.
    const top = await page.locator(`[id="${id}"]`).evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(300);
  });
});

test.describe("QA-HOME-* — navbar opens on hover", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Desktop nav only.");

  /**
   * A hover that lands before hydration is lost, and repeating `hover()` at the
   * same coordinates dispatches no fresh `mouseenter` — the pointer never left.
   * So each retry parks the pointer elsewhere first and genuinely re-enters.
   */
  async function hoverUntilOpen(page: Page, trigger: Locator) {
    await expect
      .poll(
        async () => {
          const state = await trigger.getAttribute("aria-expanded");
          if (state === "true") return state;
          await page.mouse.move(0, 0);
          // A re-hover can still lose a race with hydration — swallow it and
          // re-read rather than failing the whole poll.
          await trigger.hover({ timeout: 2_000 }).catch(() => {});
          return trigger.getAttribute("aria-expanded");
        },
        { timeout: 20_000, intervals: [100, 250, 500, 1_000] },
      )
      .toBe("true");
  }

  test("the Resources dropdown opens on hover without a click", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /^Resources$/ });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await hoverUntilOpen(page, trigger);
    // Blog is the dropdown's remaining entry — Help Centre and About Us came out
    // with QA-HOME-A12 because both already sit in the utility row. This test is
    // about the hover contract, so it asserts the panel's content, whatever it is.
    await expect(page.getByRole("link", { name: "Blog" }).first()).toBeVisible();
  });

  test("the mega menu opens on hover and survives the pointer moving into it", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /Our courses/i });

    await hoverUntilOpen(page, trigger);

    await page.locator("#mega-menu").hover();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("the mega menu closes once the pointer leaves it", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /Our courses/i });

    await hoverUntilOpen(page, trigger);
    const panel = page.locator("#mega-menu");
    await expect(panel).toBeVisible();

    // Park the pointer well below the panel. It used to stay open forever here:
    // the panel's own full-screen backdrop meant `mouseleave` never fired.
    const below = await panel.evaluate((el) => el.getBoundingClientRect().bottom);
    await page.mouse.move(200, Math.round(below) + 80);

    await expect(panel).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("the rest of the page stays interactive while the mega menu is open", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /Our courses/i });

    await hoverUntilOpen(page, trigger);

    // Nothing the menu owns may sit over the header or the page body — the
    // topmost element at each of these points has to be the control itself.
    const covered = await page.evaluate(() => {
      const panel = document.getElementById("mega-menu");
      if (!panel) return ["#mega-menu missing"];
      const targets: [string, Element | null][] = [
        ["logo", document.querySelector('header a[aria-label*="home"]')],
        ["search input", document.getElementById("header-search")],
        [
          "trigger",
          [...document.querySelectorAll("header button")].find((b) =>
            /Our courses/i.test(b.textContent ?? ""),
          ) ?? null,
        ],
      ];
      const bad: string[] = [];
      for (const [name, el] of targets) {
        if (!el) {
          bad.push(`${name}: not found`);
          continue;
        }
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        if (!top || !(el.contains(top) || el === top)) {
          bad.push(`${name}: covered by ${top?.tagName}.${(top as HTMLElement)?.className}`);
        }
      }
      // …and a point in the page body below the panel.
      const under = document.elementFromPoint(200, panel.getBoundingClientRect().bottom + 40);
      if (under?.closest("#mega-menu")) bad.push("page body below the panel: covered by the menu");
      return bad;
    });

    expect(covered).toEqual([]);
  });

  test("the mega menu survives a slow pointer crossing the gap below the trigger", async ({
    page,
  }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /Our courses/i });

    await hoverUntilOpen(page, trigger);
    const panel = page.locator("#mega-menu");

    const { x, from, to } = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("header button")].find((b) =>
        /Our courses/i.test(b.textContent ?? ""),
      )!;
      const b = btn.getBoundingClientRect();
      const p = document.getElementById("mega-menu")!.getBoundingClientRect();
      return {
        x: Math.round(b.x + b.width / 2),
        from: Math.round(b.bottom),
        to: Math.round(p.top),
      };
    });

    // Step through the dead strip pausing longer than the 150ms close delay at
    // each step: the CSS bridge on the trigger, not the timer, keeps this open.
    for (let y = from + 1; y <= to + 10; y += 4) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(200);
    }

    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});

test.describe("QA-BLOG-* — card date does not overflow", () => {
  test("blog cards use the three-letter month form", async ({ page }) => {
    await page.goto("/blog");
    const shortForm = page
      .getByText(/^\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/)
      .first();
    if ((await page.locator('a[href^="/blog/"]').count()) === 0) {
      test.skip(true, "No blog posts published.");
    }

    await expect(shortForm).toBeVisible();
    // And no card falls back to the long form that overflowed at 440.
    await expect(
      page.getByText(/^\d{1,2} (January|February|September|December) \d{4}$/),
    ).toHaveCount(0);
  });
});
