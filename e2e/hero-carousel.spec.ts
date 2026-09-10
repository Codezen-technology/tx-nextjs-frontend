import { test, expect } from "@playwright/test";

// Active dot carries the `.scale-125` class (see hero-carousel.tsx). Its aria-label
// ("Go to slide N") tells us which slide is active without depending on DOM order.
const ACTIVE_DOT = 'button[aria-label^="Go to slide"].scale-125';

// The carousel is `hidden xl:flex` — only rendered at xl (1280px) and above, the same
// breakpoint at which the hero switches to a row. Below it the hero shows a single
// fallback course card instead. Desktop Chrome's default 1280px viewport is exactly the
// breakpoint, so the carousel is visible there.
const XL = 1280;

/**
 * The hero renders nothing course-shaped when the API returns no courses, which would turn
 * every assertion below into a vacuous pass. Skipping on that is only safe when it is
 * deliberate: set `ALLOW_EMPTY_HERO=1` for a fixture-less environment. Otherwise an empty
 * hero is a failure, so a backend that stops returning courses cannot quietly retire this
 * whole suite into green skips.
 */
async function requireHeroCourses(page: import("@playwright/test").Page) {
  const rendered = await page
    .getByTestId("hero-row")
    .getByTestId(/hero-(carousel|fallback)-card/)
    .count();
  if (rendered > 0) return;
  if (process.env.ALLOW_EMPTY_HERO === "1") {
    test.skip(true, "hero has no courses and ALLOW_EMPTY_HERO=1");
  }
  throw new Error(
    "Hero rendered no course cards. The regression coverage below cannot run. " +
      "Seed courses in the backend, or set ALLOW_EMPTY_HERO=1 if that is intended.",
  );
}

/** The homepage-overflow requirement, asserted at every width this change touches. */
async function expectNoHorizontalOverflow(page: import("@playwright/test").Page, width: number) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBe(width);
}

test.describe("home hero carousel", () => {
  test("prev/next wrap and dots navigate", async ({ page }) => {
    await page.setViewportSize({ width: XL, height: 900 });
    await page.goto("/");
    await requireHeroCourses(page);

    const prevBtn = page.getByRole("button", { name: "Previous course" });
    const nextBtn = page.getByRole("button", { name: "Next course" });

    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    const dots = page.locator('button[aria-label^="Go to slide"]');
    const total = await dots.count();
    expect(total).toBeGreaterThan(0);

    // Initial state: first slide active.
    await expect(page.locator(ACTIVE_DOT)).toHaveAttribute("aria-label", "Go to slide 1");

    if (total > 1) {
      // next advances 1 → 2
      await nextBtn.click();
      await expect(page.locator(ACTIVE_DOT)).toHaveAttribute("aria-label", "Go to slide 2");

      // prev returns 2 → 1
      await prevBtn.click();
      await expect(page.locator(ACTIVE_DOT)).toHaveAttribute("aria-label", "Go to slide 1");

      // prev wraps 1 → last  (this is the (a - 1 + total) % total branch)
      await prevBtn.click();
      await expect(page.locator(ACTIVE_DOT)).toHaveAttribute("aria-label", `Go to slide ${total}`);

      // next wraps last → 1
      await nextBtn.click();
      await expect(page.locator(ACTIVE_DOT)).toHaveAttribute("aria-label", "Go to slide 1");
    }

    // Direct dot navigation jumps to the chosen slide.
    await dots.last().click();
    await expect(page.locator(ACTIVE_DOT)).toHaveAttribute("aria-label", `Go to slide ${total}`);
  });

  // Regression: the stack used to be laid out with hard-coded pixel offsets spanning
  // 660px, which only fit once the strip was ~716px wide (viewport >= 1440). At 1280 and
  // 1300 the rightmost card ran past the hero container and was silently swallowed by the
  // section's `overflow-x-clip`. Assert against the container, NOT document.scrollWidth —
  // the clip makes scrollWidth pass no matter how far the cards spill.
  for (const width of [XL, 1300, 1440, 1920]) {
    test(`card stack fits the hero container at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await requireHeroCourses(page);

      const cards = page.getByTestId("hero-carousel-card");
      const rowBox = await page.getByTestId("hero-row").boundingBox();
      expect(rowBox).not.toBeNull();
      const rowRight = rowBox!.x + rowBox!.width;

      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const box = await cards.nth(i).boundingBox();
        expect(box, `card ${i} has no layout box`).not.toBeNull();
        // Sub-pixel rounding from the percentage widths — 1px of slack, not 30.
        expect(box!.x + box!.width, `card ${i} right edge`).toBeLessThanOrEqual(rowRight + 1);
      }

      await expectNoHorizontalOverflow(page, width);
    });
  }

  // Regression: the carousel used to unhide at lg (1024) while the hero row only became
  // horizontal at xl (1280) and the fallback card hid at lg — so 1024-1279px showed a
  // carousel collapsed to its own nav row and no usable card at all. 1279 is the boundary
  // case: one pixel below the breakpoint the fallback must still be the visible one.
  for (const width of [440, 768, 1024, XL - 1]) {
    test(`shows the single fallback card and no carousel at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await requireHeroCourses(page);

      // The carousel stays in the DOM below xl — `hidden xl:flex` hides it via display,
      // so assert visibility rather than element count.
      await expect(page.getByRole("button", { name: "Next course" })).toBeHidden();
      await expect(page.getByTestId("hero-carousel-card").first()).toBeHidden();

      const fallback = page.getByTestId("hero-fallback-card");
      await expect(fallback).toBeVisible();
      await expect(fallback.locator("a[href^='/course/']").first()).toBeVisible();

      // Below xl the hero stacks; `xl:flex-row` must not have leaked down.
      await expect(page.getByTestId("hero-row")).toHaveCSS("flex-direction", "column");

      await expectNoHorizontalOverflow(page, width);
    });
  }

  // The carousel and the horizontal hero row have to switch on together: when they did not,
  // the carousel landed in column flow and sized itself to its own nav row.
  test(`shows the carousel beside the headline at ${XL}px`, async ({ page }) => {
    await page.setViewportSize({ width: XL, height: 900 });
    await page.goto("/");
    await requireHeroCourses(page);

    await expect(page.getByRole("button", { name: "Next course" })).toBeVisible();
    await expect(page.getByTestId("hero-carousel-card").first()).toBeVisible();
    await expect(page.getByTestId("hero-fallback-card")).toBeHidden();

    // Side by side, not stacked.
    await expect(page.getByTestId("hero-row")).toHaveCSS("flex-direction", "row");
  });
});
