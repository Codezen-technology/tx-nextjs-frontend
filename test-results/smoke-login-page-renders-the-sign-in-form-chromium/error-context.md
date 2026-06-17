# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> login page renders the sign-in form
- Location: e2e/smoke.spec.ts:19:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /log in/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /log in/i })

```

# Page snapshot

```yaml
- generic [ref=e2]: Internal Server Error
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  |
  3  | test("home page loads", async ({ page }) => {
  4  |   await page.goto("/");
  5  |   await expect(page).toHaveTitle(/.+/);
  6  |   await expect(page.locator("body")).toBeVisible();
  7  | });
  8  |
  9  | test("courses page is accessible without login", async ({ page }) => {
  10 |   await page.goto("/courses");
  11 |   await expect(page).not.toHaveURL(/login/);
  12 | });
  13 |
  14 | test("dashboard redirects unauthenticated users to login", async ({ page }) => {
  15 |   await page.goto("/dashboard");
  16 |   await expect(page).toHaveURL(/login/);
  17 | });
  18 |
  19 | test("login page renders the sign-in form", async ({ page }) => {
  20 |   await page.goto("/login");
> 21 |   await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
     |                                                               ^ Error: expect(locator).toBeVisible() failed
  22 | });
  23 |
```
