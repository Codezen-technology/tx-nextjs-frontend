import { test, expect, type Page } from "@playwright/test";

/**
 * The widget actually mounting — the half `src/__tests__/live-chat-widget.test.tsx`
 * cannot see, because jsdom never executes the vendor bundle.
 *
 * `[data-live-chat-widget]` is the Shadow DOM host the bundle appends to
 * `<body>`. It is the stable contract to assert on; the launcher's copy is the
 * vendor's to change.
 *
 * Everything here needs the same two things the app needs: the widget URL
 * configured *for the server under test* (the tag is not rendered otherwise)
 * and that server actually running. A run without the variable skips — and
 * skips loudly, naming what is missing, because `playwright.config.ts` already
 * records what a silent skip cost this suite once.
 */
const WIDGET_URL = process.env.NEXT_PUBLIC_LIVE_CHAT_WIDGET_URL ?? "";

test.describe("live chat widget", () => {
  test.skip(
    !WIDGET_URL,
    "NEXT_PUBLIC_LIVE_CHAT_WIDGET_URL is not set — the app renders no widget script, " +
      "so there is nothing to assert. Set it for the dev server AND this process to run these.",
  );

  /**
   * The bundle makes a routing-status round-trip to the chat API before it
   * mounts anything, so this waits on the host rather than asserting
   * immediately after load.
   */
  async function expectWidgetMounted(page: Page) {
    await expect(page.locator("[data-live-chat-widget]")).toBeAttached({ timeout: 15_000 });
  }

  test("mounts on a public marketing page", async ({ page }) => {
    await page.goto("/");
    await expectWidgetMounted(page);
  });

  test("mounts on a second public route group", async ({ page }) => {
    // Stands in for the spec's "Non-default locale" scenario, which cannot be
    // exercised today: `src/i18n/routing.ts` declares one locale (`en`) with
    // `localePrefix: "as-needed"`, so no prefixed URL exists to visit. What the
    // scenario is really guarding — that the mount is above every route group
    // rather than per-page — is what a second group covers. Add the locale case
    // here when a second locale lands.
    await page.goto("/all-courses");
    await expectWidgetMounted(page);
  });

  test("mounts on an authenticated route", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL ?? "";
    const password = process.env.TEST_USER_PASSWORD ?? "";
    test.skip(
      !email || !password,
      "TEST_USER_EMAIL / TEST_USER_PASSWORD are not set — cannot reach /dashboard, " +
        "which the proxy bounces to /login for anonymous visitors.",
    );

    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 20_000 });

    await expectWidgetMounted(page);
  });

  test("the page still works when the widget script is blocked", async ({ page }) => {
    // The spec's "Script blocked or unreachable": an ad blocker, a DNS failure,
    // a bad deploy of the vendor bundle. None of it may reach the page.
    const widgetOrigin = new URL(WIDGET_URL).origin;
    await page.route(`${widgetOrigin}/**`, (route) => route.abort());

    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.locator("[data-live-chat-widget]")).toHaveCount(0);
    expect(
      pageErrors,
      `unhandled page errors: ${pageErrors.map((e) => e.message).join("; ")}`,
    ).toHaveLength(0);
  });
});
