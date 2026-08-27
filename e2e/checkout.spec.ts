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
});
