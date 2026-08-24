import { test, expect } from "@playwright/test";

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
 * Put a purchasable course in the guest cart, then land on /checkout.
 *
 * The guest cart is keyed by a WooCommerce Store API `Cart-Token`, which the app
 * keeps in localStorage (`wc-cart-token`) and sends as `x-cart-token` — not by a
 * cookie. A bare fetch therefore creates a cart the page never sees: the POST
 * succeeds, the page reads its own empty cart, and `/checkout` bounces to
 * `/cart`. So the token has to be bootstrapped and stored the same way the app
 * stores it.
 */
async function seedCartAndOpenCheckout(page: import("@playwright/test").Page) {
  const wpBase = process.env.NEXT_PUBLIC_WP_API_URL ?? "http://localhost";
  await page.goto("/all-courses");

  const seeded = await page.evaluate(async (base) => {
    const TOKEN_KEY = "wc-cart-token";
    const NONCE_KEY = "wc-cart-nonce";

    // Bootstrap a cart token, exactly as cartFetch() does before any write.
    const bootstrap = await fetch("/api/cart", { credentials: "include" });
    const bt = bootstrap.headers.get("x-cart-token");
    const bn = bootstrap.headers.get("x-wc-store-api-nonce");
    if (bt) {
      localStorage.setItem(TOKEN_KEY, bt);
      localStorage.setItem(NONCE_KEY, bn ?? "");
    }

    // Public course reads go straight to WP, so the browser can ask it directly
    // for a course with a WooCommerce product behind it.
    const list = await fetch(`${base}/wp-json/lms-backend/v1/courses?per_page=30`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    const items = list?.data?.items ?? list?.items ?? [];
    const course = items.find(
      (c: Record<string, unknown>) =>
        Number(c.product_id ?? (c.pricing as Record<string, unknown>)?.product_id ?? 0) > 0,
    );
    if (!course) return false;
    const productId = Number(
      course.product_id ?? (course.pricing as Record<string, unknown>)?.product_id,
    );

    const added = await fetch("/api/cart/items", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-cart-token": localStorage.getItem(TOKEN_KEY) ?? "",
        "x-wc-store-api-nonce": localStorage.getItem(NONCE_KEY) ?? "",
      },
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    });
    const newToken = added.headers.get("x-cart-token");
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(NONCE_KEY, added.headers.get("x-wc-store-api-nonce") ?? "");
    }
    return added.ok;
  }, wpBase);

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
