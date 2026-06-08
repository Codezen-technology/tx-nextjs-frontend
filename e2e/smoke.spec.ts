import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator("body")).toBeVisible();
});

test("courses page is accessible without login", async ({ page }) => {
  await page.goto("/courses");
  await expect(page).not.toHaveURL(/login/);
});

test("dashboard redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
});

test("login page renders the sign-in form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
});
