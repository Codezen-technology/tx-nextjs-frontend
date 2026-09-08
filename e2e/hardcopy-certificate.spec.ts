import { test, expect } from "@playwright/test";

/**
 * `/hardcopy-certificate` — the hardcopy-led certificate funnel.
 *
 * The slug used to 301 to `/certificate`, landing every inbound link on the
 * digital-led offer. The redirect assertion below is the regression guard.
 *
 * The order form only renders once the deployed plugin serves
 * `/certificate/hardcopy/*` (see `docs/HARDCOPY_CERTIFICATE_API.md`); until then
 * the 404 fails closed to an "unavailable" notice rather than showing the default
 * product's prices. Tests that depend on the form therefore accept either state
 * and assert only what holds in both.
 */
test.describe("hardcopy certificate page", () => {
  test("serves its own page instead of redirecting to /certificate", async ({ page }) => {
    const response = await page.goto("/hardcopy-certificate");

    expect(response?.status(), "expected a 200, not a redirect").toBe(200);
    expect(new URL(page.url()).pathname).toBe("/hardcopy-certificate");
  });

  test("still redirects the sibling legacy certificate slug", async ({ page }) => {
    await page.goto("/thank-you-for-ordering-certificate");
    expect(new URL(page.url()).pathname).toBe("/certificate");
  });

  test("renders the hardcopy hero unauthenticated", async ({ page }) => {
    await page.goto("/hardcopy-certificate");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Order Hardcopy Certificate/i);
    await expect(
      page.getByText(/Power Your Professional Growth with CPD Certification & Transcript/i),
    ).toBeVisible();
    await expect(page.getByText(/Showcase Your Professional Growth/i)).toBeVisible();
    // Protected routes bounce to /login; this one must not.
    expect(new URL(page.url()).pathname).toBe("/hardcopy-certificate");
  });

  test("shows an order area — either the form or the unavailable notice", async ({ page }) => {
    await page.goto("/hardcopy-certificate");

    const unavailable = page.getByText(/ordering is unavailable/i);
    const payButton = page.getByRole("button", { name: /^Pay/ });

    await expect(unavailable.or(payButton).first()).toBeVisible({ timeout: 15_000 });
  });

  test("blocks payment until a hardcopy option is chosen", async ({ page }) => {
    await page.goto("/hardcopy-certificate");

    const payButton = page.getByRole("button", { name: /^Pay/ });
    const formRendered = await payButton
      .waitFor({ state: "visible", timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    test.skip(!formRendered, "deployed plugin does not serve the hardcopy product yet");

    // Nothing in the hardcopy group is pre-selected — it has no £0 opt-out.
    await payButton.click();
    await expect(page.getByText(/is required/i).first()).toBeVisible();
  });

  test("carries a self-referencing canonical on the frontend domain", async ({ page }) => {
    await page.goto("/hardcopy-certificate");

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical, "expected a canonical link").toBeTruthy();
    expect(new URL(canonical!).pathname).toBe("/hardcopy-certificate");
    expect(canonical).not.toContain("cms.trainingexcellence.org.uk");
  });
});
