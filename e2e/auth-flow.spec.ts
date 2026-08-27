import { test, expect } from "@playwright/test";

test.describe("Auth redirect flows", () => {
  test("unauthenticated user is redirected from /dashboard to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirect preserves ?next= param pointing to protected route", async ({ page }) => {
    await page.goto("/dashboard");
    const url = new URL(page.url());
    expect(url.searchParams.get("next")).toContain("dashboard");
  });

  test("/login page renders the login form", async ({ page }) => {
    await page.goto("/login");
    // Targeted by label, not by placeholder. The identity field is labelled
    // "Email or Username" and its placeholder is an example address, so
    // `getByPlaceholder("Email")` matched nothing and this failed on a form that
    // renders correctly. A label is the field's contract; a placeholder is copy.
    await expect(page.getByLabel(/email or username/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
  });

  test("/register page renders the registration form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("button", { name: /register/i })).toBeVisible();
  });

  // Skipped: requires valid test credentials against the live WP backend.
  // To enable: set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test.local
  // and implement the login + redirect assertion below.
  test.skip("authenticated user is redirected from /login to /dashboard", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL ?? "";
    const password = process.env.TEST_USER_PASSWORD ?? "";

    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("••••••••••••").fill(password);
    await page.getByRole("button", { name: /log in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });
});
