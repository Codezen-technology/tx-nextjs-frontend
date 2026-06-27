import { test, expect } from "@playwright/test";

// Active dot carries the `.scale-125` class (see hero-carousel.tsx). Its aria-label
// ("Go to slide N") tells us which slide is active without depending on DOM order.
const ACTIVE_DOT = 'button[aria-label^="Go to slide"].scale-125';

// The carousel is `hidden lg:flex` — only rendered on lg+ viewports.
// Desktop Chrome's default 1280px viewport clears the lg breakpoint, so it is visible.
test.describe("home hero carousel", () => {
  test("prev/next wrap and dots navigate", async ({ page }) => {
    await page.goto("/");

    const prevBtn = page.getByRole("button", { name: "Previous course" });
    const nextBtn = page.getByRole("button", { name: "Next course" });

    // Some environments have no courses from the API → carousel returns null. Skip then.
    if ((await prevBtn.count()) === 0) {
      test.skip(true, "hero carousel not rendered (no courses in this environment)");
    }

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
});
