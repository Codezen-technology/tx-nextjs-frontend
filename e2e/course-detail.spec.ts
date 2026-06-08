import { test, expect } from "@playwright/test";

// Uses the first course returned by the API — adjust slug if the site has no courses.
const KNOWN_SLUG = "fire-safety-training";

test.describe("Course detail page", () => {
  test("renders with correct page title", async ({ page }) => {
    await page.goto(`/course/${KNOWN_SLUG}`);
    await expect(page).toHaveTitle(/.+/);
    // Title should not be the bare "Course" fallback
    const title = await page.title();
    expect(title).not.toBe("Course");
  });

  test("has a canonical link pointing to the frontend domain", async ({ page }) => {
    await page.goto(`/course/${KNOWN_SLUG}`);
    await page.waitForLoadState("networkidle");
    const canonical = await page.evaluate(
      () => document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
    );
    expect(canonical).toBeTruthy();
    expect(canonical).not.toContain("trainingexcellence.org.uk");
    expect(canonical).toContain(`/course/${KNOWN_SLUG}`);
  });

  test("injects valid JSON-LD structured data", async ({ page }) => {
    await page.goto(`/course/${KNOWN_SLUG}`);
    await page.waitForLoadState("networkidle");
    const scripts = await page.evaluate(() =>
      [...document.querySelectorAll('script[type="application/ld+json"]')].map(
        (s) => s.textContent,
      ),
    );
    expect(scripts.length).toBeGreaterThan(0);
    expect(() => JSON.parse(scripts[0] ?? "")).not.toThrow();
  });

  test("renders course breadcrumb", async ({ page }) => {
    await page.goto(`/course/${KNOWN_SLUG}`);
    await expect(
      page.locator("nav[aria-label], [data-testid='breadcrumb'], ol, nav").first(),
    ).toBeVisible();
  });

  test("unknown slug returns 404", async ({ page }) => {
    const response = await page.goto("/course/this-course-does-not-exist-xyz-abc-999");
    // Next.js notFound() returns a 404
    expect(response?.status()).toBe(404);
  });
});
