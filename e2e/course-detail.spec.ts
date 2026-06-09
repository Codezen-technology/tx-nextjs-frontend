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
