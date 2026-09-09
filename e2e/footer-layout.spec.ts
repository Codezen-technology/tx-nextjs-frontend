import { test, expect, type Page } from "@playwright/test";

/**
 * The footer's main body lays out three fixed-width, `shrink-0` columns side by side:
 * 400 (logo) + 320 (link groups) + 360 (certificate validator), plus 32px of inner padding
 * on each side and two 40px gaps — 1224px that cannot compress. Its container offers
 * `min(viewport, 1296) - 32`, so the row only fits from 1280 up.
 *
 * It used to switch to a row at `lg` (1024), where it was 232px short and ran to x=1208
 * with nothing able to shrink. The existing homepage overflow test never caught it because
 * `playwright.config.ts` only runs 1920, 1280 and 440 — the failure lives in the band
 * between the last two.
 */
const STACKED = [768, 1024, 1279];
const ROW = [1280, 1440, 1920];

/** Elements past the right edge that no ancestor clips — the ones that grow the document. */
async function unclippedOffenders(page: Page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const offenders: string[] = [];
    document.querySelectorAll("footer *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= viewportWidth + 1) return;
      for (let p = el.parentElement; p; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === "hidden" || o === "clip" || o === "auto" || o === "scroll") return;
      }
      offenders.push(
        `<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 60)}"> right=${Math.round(r.right)}`,
      );
    });
    return { viewportWidth, scrollWidth: document.documentElement.scrollWidth, offenders };
  });
}

test.describe("footer layout", () => {
  for (const width of [...STACKED, ...ROW]) {
    test(`footer stays inside the viewport at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.locator("footer")).toBeVisible();

      const m = await unclippedOffenders(page);
      expect(
        m.offenders,
        `footer content past the right edge @${width}: ${m.offenders.slice(0, 5).join(" | ")}`,
      ).toEqual([]);
      expect(m.scrollWidth, `document scrollWidth @${width}`).toBe(width);
    });
  }

  // The row must switch on only where its fixed columns fit, so the two cannot drift apart
  // again. 1279/1280 is the boundary that matters.
  for (const width of STACKED) {
    test(`footer body stacks at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(footerBody(page)).toHaveCSS("flex-direction", "column");
    });
  }

  for (const width of ROW) {
    test(`footer body is a row at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(footerBody(page)).toHaveCSS("flex-direction", "row");
    });
  }
});

/** The footer's main body row — the flex container holding the three columns. */
function footerBody(page: Page) {
  return page.getByTestId("footer-body");
}
