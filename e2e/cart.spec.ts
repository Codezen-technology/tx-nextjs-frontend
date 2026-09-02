import { test, expect } from "@playwright/test";
import { seedGuestCart } from "./helpers/cart";

/**
 * QA-CART-* — the Cart page rows that round 1 could not close.
 *
 * Like `checkout.spec.ts`, these seed a guest cart, so they live outside
 * `design-fidelity.spec.ts`, which deliberately asserts against pages it can
 * reach without state.
 *
 * Frame: `6239:113878` — desktop `6239:113879`, mobile `6239:114071`.
 */

// Serial for the same reason as the checkout spec: concurrent guest-cart
// seedings against one local WooCommerce make the whole file crawl.
test.describe.configure({ mode: "serial" });

async function seedCartAndOpen(page: import("@playwright/test").Page) {
  const seeded = await seedGuestCart(page);
  if (!seeded) return null;

  await page.goto("/cart");
  const remove = page.getByRole("button", { name: /^Remove /i }).first();
  await remove.waitFor({ timeout: 30_000 }).catch(() => {});
  return (await remove.count()) > 0 ? remove : null;
}

test.describe("QA-CART-* — cart page", () => {
  test.beforeEach(() => test.slow());

  /**
   * QA-CART-E1 — "the price and the cross are in the middle of the screen".
   *
   * The report offered two layouts and picked neither, so the row was parked as
   * blocked on design. The mobile frame had already chosen: `6239:114085` puts
   * the stepper at x=0 of a 344-wide row and groups the total and the remove
   * control at x=246 — both to the right, the report's first option.
   *
   * Geometry, not class names: a class assertion would pass while a parent's
   * flex direction quietly undid the alignment.
   */
  test("QA-CART-E1: the total and remove control sit at the row's right edge", async ({
    page,
    viewport,
  }, testInfo) => {
    test.skip(
      !viewport || viewport.width > 640,
      "The wrapped controls layout only exists below the sm breakpoint",
    );

    const remove = await seedCartAndOpen(page);
    test.skip(!remove, "No purchasable course available on the WP backend to seed a cart.");

    const removeBox = await remove!.boundingBox();
    const stepper = page.getByRole("button", { name: /increase quantity/i }).first();
    const hasStepper = (await stepper.count()) > 0;
    const decrease = page.getByRole("button", { name: /decrease quantity/i }).first();
    const decreaseBox = hasStepper ? await decrease.boundingBox() : null;

    const row = remove!.locator('xpath=ancestor::div[contains(@class,"border-b")][1]');
    const rowBox = await row.boundingBox();
    expect(rowBox, "could not measure the cart row").not.toBeNull();

    // The remove control ends within 24px of the row's right edge.
    const gapRight = rowBox!.x + rowBox!.width - (removeBox!.x + removeBox!.width);
    expect(
      gapRight,
      `cart @${testInfo.project.name}: the remove control is ${Math.round(gapRight)}px from the row's right edge — the frame puts it at the edge (6239:114096)`,
    ).toBeLessThan(24);

    // And the stepper stays at the row's left edge, rather than drifting right
    // with it — `justify-end` on the whole row would also pass the check above.
    if (decreaseBox) {
      const gapLeft = decreaseBox.x - rowBox!.x;
      expect(
        gapLeft,
        `cart @${testInfo.project.name}: the quantity stepper is ${Math.round(gapLeft)}px from the row's left edge — the frame anchors it there`,
      ).toBeLessThan(24);

      // The two must not be adjacent: that is the "middle of the screen" the
      // report filed.
      expect(
        removeBox!.x - (decreaseBox.x + decreaseBox.width),
        `cart @${testInfo.project.name}: the stepper and the remove control are packed together — nothing was pushed to the right edge`,
      ).toBeGreaterThan(24);
    }
  });

  test("the cart suggests further courses", async ({ page }, testInfo) => {
    const remove = await seedCartAndOpen(page);
    test.skip(!remove, "No purchasable course available on the WP backend to seed a cart.");

    const heading = page.getByRole("heading", { name: /customers also purchased/i }).first();
    await heading.waitFor({ timeout: 30_000 }).catch(() => {});
    test.skip(
      (await heading.count()) === 0,
      "The backend returned no popular courses, so the section renders nothing by design.",
    );

    await expect(
      heading,
      `cart @${testInfo.project.name}: expected the frame's suggestion section (6239:113955)`,
    ).toBeVisible();

    // Counted by distinct course URL, not by link: a card carries several links
    // to the same course (thumbnail, title, CTA), so a link count reads three
    // cards as nine and would pass a cap of three by accident.
    const section = heading.locator("xpath=ancestor::section[1]");
    // The heading renders alongside skeletons while the query is in flight, so
    // counting straight after it waits on finds zero cards and reads as a broken
    // section rather than a slow one.
    await section
      .locator('a[href*="/course/"]')
      .first()
      .waitFor({ timeout: 60_000 })
      .catch(() => {});

    const courseHrefs = await section.evaluate((el) => {
      const hrefs = [...el.querySelectorAll('a[href*="/course/"]')].map(
        (a) => (a as HTMLAnchorElement).getAttribute("href") ?? "",
      );
      return [...new Set(hrefs)];
    });

    expect(
      courseHrefs.length,
      `cart @${testInfo.project.name}: the suggestion section rendered no courses under its heading`,
    ).toBeGreaterThan(0);
    expect(
      courseHrefs.length,
      `cart @${testInfo.project.name}: the section shows ${courseHrefs.length} courses — the frame carries three (6239:113957)`,
    ).toBeLessThanOrEqual(3);
  });

  test("the trust band sits beneath the checkout button", async ({ page }, testInfo) => {
    const remove = await seedCartAndOpen(page);
    test.skip(!remove, "No purchasable course available on the WP backend to seed a cart.");

    const band = page.getByText(/guaranteed safe & secure checkout/i).first();
    await expect(
      band,
      `cart @${testInfo.project.name}: expected the same trust band the checkout page carries (6239:113976)`,
    ).toBeVisible();

    const button = page.getByRole("button", { name: /proceed to checkout/i }).first();
    const buttonBox = await button.boundingBox();
    const bandBox = await band.boundingBox();
    expect(
      buttonBox && bandBox && bandBox.y > buttonBox.y,
      `cart @${testInfo.project.name}: expected the band below the checkout button`,
    ).toBe(true);
  });

  test("the trusted strip sits beneath the header", async ({ page }, testInfo) => {
    await page.goto("/cart");
    await expect(
      page.getByText(/money-back guarantee/i).first(),
      `cart @${testInfo.project.name}: expected the trusted strip every cart frame carries beneath the header`,
    ).toBeVisible();
  });
});
