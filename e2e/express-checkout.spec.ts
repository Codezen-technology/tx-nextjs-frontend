import { test, expect, type Page, type Request } from "@playwright/test";
import { seedGuestCart } from "./helpers/cart";

/**
 * Express checkout (Apple Pay / Google Pay) on the cart page.
 *
 * No CI runner has a wallet, so none of this can tap a button. What it can do
 * is catch the failure this feature actually shipped with: `useCart().currency`
 * is a display symbol ("£"), and passing it to Stripe threw an IntegrationError
 * inside the effect that created the element. Nothing appeared, nothing was
 * logged, and the cart looked exactly as it does on a device with no wallet.
 *
 * So the assertions are on the request Stripe makes when Elements initialises —
 * which carries the currency and the amount — and on the two states of the
 * element's wrapper. A wallet-less runner must reach "mounted, no wallet
 * offered", never "never mounted".
 */

// Serial for the same reason as `cart.spec.ts`: concurrent guest-cart seedings
// against one local WooCommerce make the file crawl.
test.describe.configure({ mode: "serial" });

/** Stripe's Elements bootstrap. Its query string carries the deferred intent. */
const SESSIONS_URL = /\/v1\/elements\/sessions/;

interface CartFixture {
  /** The Elements bootstrap request, or null if Elements never initialised. */
  sessions: Request | null;
  /** Errors thrown on the page, which is how a bad currency would surface. */
  pageErrors: string[];
}

/**
 * Seeds a guest cart and opens `/cart`.
 *
 * Returns null only when the backend has no purchasable course — the one
 * condition a runner cannot fix and the only one worth skipping for. A cart
 * that seeds but then fails to render is a failure, not a skip: an
 * IntegrationError thrown while Elements initialises takes the whole cart
 * subtree down with it, and a spec that skipped there would go quiet on exactly
 * the regression it exists to catch.
 */
async function seedCartAndOpen(page: Page): Promise<CartFixture | null> {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });

  const sessionsPromise = page
    .waitForRequest(SESSIONS_URL, { timeout: 30_000 })
    .catch(() => null as Request | null);

  const seeded = await seedGuestCart(page);
  if (!seeded) return null;

  await page.goto("/cart");
  const remove = page.getByRole("button", { name: /^Remove /i }).first();
  await remove.waitFor({ timeout: 30_000 }).catch(() => {});

  const sessions = await sessionsPromise;
  const rows = await remove.count();

  // Both of these fail together when Elements is handed something it rejects:
  // the throw happens as the element is created, and it takes the summary — and
  // with it the whole cart — down. Say so, rather than reporting an empty cart
  // and leaving the reader to guess.
  expect(
    rows > 0 && sessions !== null,
    [
      `cart rows rendered: ${rows}`,
      `Stripe Elements bootstrapped: ${sessions !== null}`,
      "Both must hold. Elements failing to bootstrap while the cart is empty is what a rejected currency looks like.",
      `page errors: ${pageErrors.join(" | ") || "none"}`,
      `console errors: ${consoleErrors.slice(0, 3).join(" | ") || "none"}`,
    ].join("\n  "),
  ).toBe(true);

  return { sessions, pageErrors };
}

function param(request: Request, key: string): string | null {
  return new URL(request.url()).searchParams.get(key);
}

test.describe("cart express checkout", () => {
  test.beforeEach(() => {
    test.slow();
    test.skip(
      !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set, so Stripe.js never loads and no element mounts.",
    );
  });

  test("initialises Stripe with the ISO currency code, not the display symbol", async ({
    page,
  }, testInfo) => {
    const fixture = await seedCartAndOpen(page);
    test.skip(!fixture, "No purchasable course available on the WP backend to seed a cart.");

    const { sessions, pageErrors } = fixture!;
    expect(
      sessions,
      `express checkout @${testInfo.project.name}: Stripe never bootstrapped Elements — the element did not mount at all`,
    ).not.toBeNull();

    const currency = param(sessions!, "deferred_intent[currency]");
    expect(
      currency,
      `express checkout @${testInfo.project.name}: expected a lowercase ISO 4217 code such as "gbp", got ${JSON.stringify(currency)}. A currency symbol here throws inside Stripe and the buttons silently never render.`,
    ).toMatch(/^[a-z]{3}$/);

    expect(
      pageErrors.join("\n"),
      `express checkout @${testInfo.project.name}: Stripe threw while initialising`,
    ).not.toMatch(/IntegrationError/i);
  });

  test("tells the wallet sheet the cart's own total", async ({ page }, testInfo) => {
    const fixture = await seedCartAndOpen(page);
    test.skip(!fixture, "No purchasable course available on the WP backend to seed a cart.");
    test.skip(!fixture!.sessions, "Elements never initialised; covered by the currency test.");

    const amount = Number(param(fixture!.sessions!, "deferred_intent[amount]"));
    expect(
      amount,
      `express checkout @${testInfo.project.name}: expected a positive minor-unit amount`,
    ).toBeGreaterThan(0);

    // The summary's TOTAL row is what the buyer reads, so it is what the wallet
    // sheet has to agree with. Compared in minor units to avoid float drift.
    const totalText = await page
      .getByText(/^TOTAL:?$/i)
      .first()
      .locator("xpath=following-sibling::*[1]")
      .innerText()
      .catch(() => "");
    const displayed = Number(totalText.replace(/[^0-9.]/g, ""));
    test.skip(!Number.isFinite(displayed) || displayed <= 0, "Could not read the summary total.");

    expect(
      amount,
      `express checkout @${testInfo.project.name}: the wallet sheet would show ${amount} minor units while the summary reads ${totalText.trim()}`,
    ).toBe(Math.round(displayed * 100));
  });

  test("mounts the element but offers nothing when the device has no wallet", async ({
    page,
  }, testInfo) => {
    const fixture = await seedCartAndOpen(page);
    test.skip(!fixture, "No purchasable course available on the WP backend to seed a cart.");

    const wrapper = page.locator("[data-express-checkout]");

    // Mounted: `onReady` cannot fire on an element that was never rendered, so
    // an absent wrapper means the component bailed out before Stripe could
    // report what the device supports.
    await expect(
      wrapper,
      `express checkout @${testInfo.project.name}: the element was never mounted, so no wallet could ever be detected`,
    ).toHaveCount(1);

    // Never inside anything hidden: Stripe has to lay the element out to work
    // out which wallets the device offers, so a `display: none` ancestor would
    // leave it reporting none — and a wrapper hidden on that answer could never
    // come back.
    await expect(
      wrapper,
      `express checkout @${testInfo.project.name}: the element is inside a hidden container, so Stripe can never report a wallet and the buttons can never appear`,
    ).toBeVisible();

    const state = await wrapper.getAttribute("data-express-checkout");
    test.skip(
      state === "available",
      "This runner reports a usable wallet, so the offers-nothing assertion does not apply.",
    );

    // Offering nothing: no divider between the checkout button and the trust
    // band, and no meaningful height taken.
    await expect(
      page.locator("[data-express-checkout] span", { hasText: /^or$/ }),
      `express checkout @${testInfo.project.name}: an "or" divider is shown on a runner with no wallet, so buyers would see a divider above nothing`,
    ).toHaveCount(0);

    const box = await wrapper.boundingBox();
    expect(
      box?.height ?? 0,
      `express checkout @${testInfo.project.name}: the empty element still occupies ${Math.round(box?.height ?? 0)}px of the summary`,
    ).toBeLessThan(24);
  });

  test("leaves the checkout button as the cart's own call to action", async ({
    page,
  }, testInfo) => {
    const fixture = await seedCartAndOpen(page);
    test.skip(!fixture, "No purchasable course available on the WP backend to seed a cart.");

    const button = page.getByRole("button", { name: /proceed to checkout/i }).first();
    await expect(
      button,
      `express checkout @${testInfo.project.name}: the card checkout path must survive the wallet buttons being added above the trust band`,
    ).toBeVisible();

    const band = page.getByText(/guaranteed safe & secure checkout/i).first();
    const buttonBox = await button.boundingBox();
    const bandBox = await band.boundingBox();
    expect(
      buttonBox && bandBox && bandBox.y > buttonBox.y,
      `express checkout @${testInfo.project.name}: the express section pushed the trust band above the checkout button`,
    ).toBe(true);
  });
});
