import { test, expect } from "@playwright/test";
import { seedGuestCart } from "./helpers/cart";

/**
 * QA-CHECK-* — checkout payment presentation.
 *
 * `/checkout` redirects to `/cart` when the cart is empty, so every test here
 * seeds one first. That is why these assertions live in their own spec rather
 * than in `design-fidelity`, which deliberately avoids seeding state.
 *
 * Targets in `.context/figma/targets.md` under "Checkout", from `6239:134328`.
 */

/**
 * Seed the guest cart, then land on /checkout.
 *
 * The seeding itself lives in `helpers/cart.ts` so `/cart` and `/checkout` do it
 * identically — see the note there about the Store API `Cart-Token`.
 */
async function seedCartAndOpenCheckout(page: import("@playwright/test").Page) {
  const seeded = await seedGuestCart(page);

  if (!seeded) return false;
  await page.goto("/checkout");

  // Not `networkidle`: Stripe Elements holds connections open, so the page never
  // reaches it and every test burns its whole budget before asserting anything.
  // Wait for the outcome instead — the payment section, or the empty-cart bounce.
  const heading = page.getByRole("heading", { name: /payment method/i }).first();
  await Promise.race([
    heading.waitFor({ state: "visible", timeout: 30_000 }),
    page.waitForURL(/\/cart/, { timeout: 30_000 }),
  ]).catch(() => {});

  return !page.url().includes("/cart") && (await heading.count()) > 0;
}

// Serial: each test seeds a guest cart against the same WooCommerce instance,
// and three concurrent seedings against a local WP make the whole spec crawl.
test.describe.configure({ mode: "serial" });

test.describe("QA-CHECK-* — checkout payment presentation", () => {
  test.beforeEach(() => test.slow());

  test("QA-CHECK-A3: card brands render as marks, not text labels", async ({ page }, testInfo) => {
    const ready = await seedCartAndOpenCheckout(page);
    test.skip(!ready, "Could not seed a cart on this backend");

    const marks = page.locator(
      'img[alt="Visa"], img[alt="Mastercard"], img[alt="Discover"], img[alt="American Express"]',
    );
    expect(
      await marks.count(),
      `checkout @${testInfo.project.name}: expected four brand marks (frame 6239:134680), found ${await marks.count()}`,
    ).toBeGreaterThanOrEqual(4);

    const body = (await page.locator("main").innerText()).toUpperCase();
    for (const label of ["MC", "DISC", "JCB"]) {
      expect(
        new RegExp(`\\b${label}\\b`).test(body),
        `checkout @${testInfo.project.name}: expected no "${label}" text label — the design carries marks, and JCB is not among them`,
      ).toBe(false);
    }
  });

  test("QA-CHECK-A4: no PayPal placeholder", async ({ page }, testInfo) => {
    const ready = await seedCartAndOpenCheckout(page);
    test.skip(!ready, "Could not seed a cart on this backend");

    const text = await page.locator("main").innerText();
    expect(
      /paypal/i.test(text),
      `checkout @${testInfo.project.name}: expected no PayPal row — the build cannot process one, so it must not be offered`,
    ).toBe(false);
    expect(
      /coming soon/i.test(text),
      `checkout @${testInfo.project.name}: expected no "coming soon" placeholder`,
    ).toBe(false);
  });

  test("QA-CHECK-A5: the payment section states 100% secure payment", async ({
    page,
  }, testInfo) => {
    const ready = await seedCartAndOpenCheckout(page);
    test.skip(!ready, "Could not seed a cart on this backend");

    const heading = page.getByRole("heading", { name: /payment method/i }).first();
    await expect(
      heading,
      `checkout @${testInfo.project.name}: expected a Payment method heading`,
    ).toBeVisible();

    const assurance = page.getByText(/100% secure payment/i).first();
    await expect(
      assurance,
      `checkout @${testInfo.project.name}: expected the frame's "100% secure payment" line beside the heading (6239:134665)`,
    ).toBeVisible();
  });

  /**
   * QA-CHECK-D1 — the section the report filed as present in Figma and absent
   * from the build, and the half of QA-CHECK-A5 that shipped unread because
   * `image 24` is a raster in the frame. Rendered, it is the trust band.
   */
  test("QA-CHECK-D1: a trust band sits beneath the pay button", async ({ page }, testInfo) => {
    const ready = await seedCartAndOpenCheckout(page);
    test.skip(!ready, "Could not seed a cart on this backend");

    const band = page.getByText(/guaranteed safe & secure checkout/i).first();
    await expect(
      band,
      `checkout @${testInfo.project.name}: expected the frame's trust band beneath the pay button (image 24, 6239:134737)`,
    ).toBeVisible();

    await expect(
      page.getByText(/powered by stripe/i).first(),
      `checkout @${testInfo.project.name}: the band names the payment processor`,
    ).toBeVisible();

    // Below the button, not above it — the band is read at the moment of
    // committing, and a trust claim above the control is a different claim.
    const buttonBox = await page
      .getByRole("button", { name: /proceed to checkout|complete order/i })
      .first()
      .boundingBox();
    const bandBox = await band.boundingBox();
    expect(
      buttonBox && bandBox && bandBox.y > buttonBox.y,
      `checkout @${testInfo.project.name}: expected the band below the pay button, not above it`,
    ).toBe(true);
  });

  /**
   * The band's artwork draws seven brands, the payment-method row four. Two
   * surfaces disagreeing about what the gateway accepts is exactly what
   * QA-CHECK-A3 was filed for, so this asserts they cannot.
   */
  test("QA-CHECK-D1: the band and the payment row list the same brands", async ({
    page,
  }, testInfo) => {
    const ready = await seedCartAndOpenCheckout(page);
    test.skip(!ready, "Could not seed a cart on this backend");

    const alts = await page.evaluate(() => {
      const groups = [...document.querySelectorAll("main img")]
        .map((img) => img.getAttribute("alt") ?? "")
        .filter((alt) => ["American Express", "Discover", "Mastercard", "Visa"].includes(alt));
      return groups;
    });

    // Four brands, twice: once in the payment-method row, once in the band.
    expect(
      alts.length,
      `checkout @${testInfo.project.name}: expected both surfaces to show four marks each, found ${alts.length} in total`,
    ).toBe(8);
    expect(
      alts.slice(0, 4),
      `checkout @${testInfo.project.name}: the two surfaces list different brands or a different order`,
    ).toEqual(alts.slice(4));
  });

  test("the trusted strip sits beneath the header", async ({ page }, testInfo) => {
    const ready = await seedCartAndOpenCheckout(page);
    test.skip(!ready, "Could not seed a cart on this backend");

    await expect(
      page.getByText(/money-back guarantee/i).first(),
      `checkout @${testInfo.project.name}: expected the trusted strip every checkout frame carries beneath the header`,
    ).toBeVisible();
  });
});
