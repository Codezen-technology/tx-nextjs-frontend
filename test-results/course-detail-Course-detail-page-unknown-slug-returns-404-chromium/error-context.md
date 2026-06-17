# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: course-detail.spec.ts >> Course detail page >> unknown slug returns 404
- Location: e2e/course-detail.spec.ts:61:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 404
Received: 500
```

# Page snapshot

```yaml
- generic [ref=e2]: Internal Server Error
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  |
  3  | let courseSlug: string | null = null;
  4  |
  5  | test.beforeAll(async () => {
  6  |   try {
  7  |     // Discover a real course slug from the WP API at runtime so tests aren't
  8  |     // hardcoded to a slug that may not exist on every dev environment.
  9  |     const base = process.env.NEXT_PUBLIC_WP_API_URL ?? "http://localhost";
  10 |     const res = await fetch(`${base}/wp-json/lms-backend/v1/courses?per_page=1`);
  11 |     if (res.ok) {
  12 |       const body = (await res.json()) as {
  13 |         data?: { items?: { slug: string }[] };
  14 |         items?: { slug: string }[];
  15 |       };
  16 |       const items = body.data?.items ?? body.items ?? [];
  17 |       courseSlug = items[0]?.slug ?? null;
  18 |     }
  19 |   } catch {
  20 |     courseSlug = null;
  21 |   }
  22 | });
  23 |
  24 | test.describe("Course detail page", () => {
  25 |   test("renders with correct page title", async ({ page }) => {
  26 |     test.skip(!courseSlug, "No courses available on WP backend");
  27 |     const response = await page.goto(`/course/${courseSlug}`);
  28 |     expect(response?.status()).toBe(200);
  29 |     const title = await page.title();
  30 |     expect(title).toBeTruthy();
  31 |     expect(title).not.toBe("Course");
  32 |   });
  33 |
  34 |   test("has a canonical link pointing to the frontend domain", async ({ page }) => {
  35 |     test.skip(!courseSlug, "No courses available on WP backend");
  36 |     await page.goto(`/course/${courseSlug}`);
  37 |     // Wait for client-side hydration to settle so head tags are stable
  38 |     await page.waitForSelector('link[rel="canonical"]', { timeout: 10_000 });
  39 |     const canonical = await page.evaluate(
  40 |       () => document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
  41 |     );
  42 |     expect(canonical).toBeTruthy();
  43 |     expect(canonical).not.toContain(process.env.NEXT_PUBLIC_WP_API_URL ?? "trainingexcellence");
  44 |     expect(canonical).toContain(`/course/${courseSlug}`);
  45 |   });
  46 |
  47 |   test("injects valid JSON-LD structured data", async ({ page }) => {
  48 |     test.skip(!courseSlug, "No courses available on WP backend");
  49 |     await page.goto(`/course/${courseSlug}`);
  50 |     // JSON-LD is rendered in the page body by CourseDetailPage (not via generateMetadata)
  51 |     await page.waitForSelector('script[type="application/ld+json"]', { timeout: 10_000 });
  52 |     const scripts = await page.evaluate(() =>
  53 |       Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
  54 |         (s) => s.textContent,
  55 |       ),
  56 |     );
  57 |     expect(scripts.length).toBeGreaterThan(0);
  58 |     expect(() => JSON.parse(scripts[0] ?? "")).not.toThrow();
  59 |   });
  60 |
  61 |   test("unknown slug returns 404", async ({ page }) => {
  62 |     const response = await page.goto("/course/this-course-does-not-exist-xyz-abc-999");
> 63 |     expect(response?.status()).toBe(404);
     |                                ^ Error: expect(received).toBe(expected) // Object.is equality
  64 |   });
  65 | });
  66 |
```
