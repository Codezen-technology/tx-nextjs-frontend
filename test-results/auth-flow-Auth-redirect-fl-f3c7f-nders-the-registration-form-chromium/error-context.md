# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flow.spec.ts >> Auth redirect flows >> /register page renders the registration form
- Location: e2e/auth-flow.spec.ts:22:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /register/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /register/i })

```

# Page snapshot

```yaml
- generic [ref=e2]: Internal Server Error
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  |
  3  | test.describe("Auth redirect flows", () => {
  4  |   test("unauthenticated user is redirected from /dashboard to /login", async ({ page }) => {
  5  |     await page.goto("/dashboard");
  6  |     await expect(page).toHaveURL(/\/login/);
  7  |   });
  8  |
  9  |   test("redirect preserves ?next= param pointing to protected route", async ({ page }) => {
  10 |     await page.goto("/dashboard");
  11 |     const url = new URL(page.url());
  12 |     expect(url.searchParams.get("next")).toContain("dashboard");
  13 |   });
  14 |
  15 |   test("/login page renders the login form", async ({ page }) => {
  16 |     await page.goto("/login");
  17 |     await expect(page.getByPlaceholder("Email")).toBeVisible();
  18 |     await expect(page.getByPlaceholder("••••••••••••")).toBeVisible();
  19 |     await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
  20 |   });
  21 |
  22 |   test("/register page renders the registration form", async ({ page }) => {
  23 |     await page.goto("/register");
> 24 |     await expect(page.getByRole("button", { name: /register/i })).toBeVisible();
     |                                                                   ^ Error: expect(locator).toBeVisible() failed
  25 |   });
  26 |
  27 |   // Skipped: requires valid test credentials against the live WP backend.
  28 |   // To enable: set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test.local
  29 |   // and implement the login + redirect assertion below.
  30 |   test.skip("authenticated user is redirected from /login to /dashboard", async ({ page }) => {
  31 |     const email = process.env.TEST_USER_EMAIL ?? "";
  32 |     const password = process.env.TEST_USER_PASSWORD ?? "";
  33 |
  34 |     await page.goto("/login");
  35 |     await page.getByPlaceholder("Email").fill(email);
  36 |     await page.getByPlaceholder("••••••••••••").fill(password);
  37 |     await page.getByRole("button", { name: /log in/i }).click();
  38 |
  39 |     await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  40 |   });
  41 | });
  42 |
```
