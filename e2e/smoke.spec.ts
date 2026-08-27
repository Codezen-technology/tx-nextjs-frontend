import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator("body")).toBeVisible();
});

test("the public course catalogue is accessible without login", async ({ page }) => {
  // `/all-courses`, not `/courses`. `/courses` lives in the (student) route
  // group and is protected by design — the proxy bounces it to
  // /login?next=/dashboard/all-courses, which is correct behaviour, not a
  // defect. This test asserted the wrong route and had been failing on a working
  // app; the public catalogue is what it meant to cover.
  await page.goto("/all-courses");
  await expect(page).not.toHaveURL(/login/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the student courses route requires login", async ({ page }) => {
  await page.goto("/courses");
  await expect(page).toHaveURL(/login/);
});

test("dashboard redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
});

test("login page renders the sign-in form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
});
