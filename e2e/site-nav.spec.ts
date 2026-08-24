import { test, expect } from "@playwright/test";

/**
 * Header and footer link membership — QA-HOME-A9, A11, A12, A13.
 *
 * These live outside any page spec because both surfaces render on every page:
 * a link removed from the header is removed site-wide, and asserting that on
 * `/` alone is enough. Assertions are on destinations rather than labels, so a
 * copy change does not fail them and a rename does not sneak a link back in.
 *
 * Report items behind each row are in `docs/qa/QA_REPORT_ITEMS.md`.
 */

/** The header renders twice — desktop nav and mobile drawer. `visible=true` picks the live one. */
const headerLink = (page: import("@playwright/test").Page, href: string) =>
  page.locator(`header a[href="${href}"]`).locator("visible=true");

/**
 * Open the mobile drawer, tolerating a click that lands before hydration.
 *
 * The toggle renders server-side, so it is clickable long before React attaches
 * its handler — a click in that window is swallowed and the drawer never opens.
 * That produced an `#mobile-nav` "element(s) not found" failure in three
 * consecutive full runs, each of which passed when the spec was re-run alone,
 * which is exactly what a hydration race looks like from the summary line.
 *
 * Retried rather than slept on: a fixed wait is either too short on a cold dev
 * server or wasted on a warm one.
 */
async function openMobileDrawer(page: import("@playwright/test").Page) {
  const toggle = page.getByRole("button", { name: /open menu/i });
  const drawer = page.locator("#mobile-nav");
  await toggle.waitFor();

  for (let attempt = 0; attempt < 3; attempt++) {
    await toggle.click();
    try {
      await drawer.waitFor({ state: "visible", timeout: 2000 });
      return;
    } catch {
      // Swallowed pre-hydration click — try again.
    }
  }
  await expect(drawer, "the mobile drawer did not open after three clicks").toBeVisible();
}

test.describe("QA-HOME-* — header and footer link membership", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("QA-HOME-A11: no Contact us link in the header, on either surface", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name === "mobile-440") {
      await openMobileDrawer(page);
    }
    expect(
      await headerLink(page, "/contact-us").count(),
      `header @${testInfo.project.name}: expected no /contact-us link, found one. The footer keeps its Contact us link — the header should not carry it too`,
    ).toBe(0);
  });

  test("QA-HOME-A13: the header carries a Pricing link", async ({ page }, testInfo) => {
    if (testInfo.project.name === "mobile-440") {
      await openMobileDrawer(page);
    }
    await expect(
      headerLink(page, "/pricing"),
      `header @${testInfo.project.name}: expected a /pricing link, found none`,
    ).toHaveCount(1);
  });

  test("QA-HOME-A12: the Resources dropdown lists neither Help Centre nor About Us", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile-440",
      "The dropdown is a desktop affordance; the drawer renders a flat list",
    );

    const trigger = page.locator('header button[aria-haspopup="menu"]', {
      hasText: /^resources$/i,
    });
    await trigger.hover();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // The panel is the trigger's own sibling — scope to it, or the utility row's
    // /help and /about-us get counted and the test can never pass.
    const panel = trigger.locator("xpath=following-sibling::div[1]");
    await expect(panel).toBeVisible();

    const inPanel = async (href: string) =>
      panel.locator(`a[href="${href}"]`).locator("visible=true").count();

    expect(
      await inPanel("/help"),
      `Resources dropdown: expected no /help entry — Help already sits in the utility row`,
    ).toBe(0);
    expect(
      await inPanel("/about-us"),
      `Resources dropdown: expected no /about-us entry — About us already sits in the utility row`,
    ).toBe(0);

    // Removing a duplicate must not remove the destination.
    expect(
      await headerLink(page, "/help").count(),
      "header: /help must remain reachable from the utility row",
    ).toBeGreaterThan(0);
    expect(
      await headerLink(page, "/about-us").count(),
      "header: /about-us must remain reachable from the utility row",
    ).toBeGreaterThan(0);
  });

  test("QA-HOME-A9: the footer drops Force for Good, Work for us and Resources", async ({
    page,
  }, testInfo) => {
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();

    for (const href of ["/force-for-good", "/careers", "/resources"]) {
      expect(
        await footer.locator(`a[href="${href}"]`).count(),
        `footer @${testInfo.project.name}: expected no link to ${href}. Prod's WP menu still serves these, so the frontend filters them — see REMOVED_FOOTER_PATHS in footer.tsx`,
      ).toBe(0);
    }

    // The filter must remove three items, not the menu.
    expect(
      await footer.locator("a").count(),
      "footer: expected the rest of the menu to survive the filter",
    ).toBeGreaterThan(5);
  });
});
