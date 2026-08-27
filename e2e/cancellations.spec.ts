import { test, expect } from "@playwright/test";

test.describe("Cancellations & support request", () => {
  test("cancellations hub loads with issue gate and refund section", async ({ page }) => {
    await page.goto("/cancellations");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("I can't access my course")).toBeVisible();
    await expect(page.getByRole("button", { name: /check refund options/i })).toBeVisible();
  });

  test("refund form reveals on ?refund=1", async ({ page }) => {
    await page.goto("/cancellations?refund=1#refund-form");
    await expect(page.getByRole("heading", { name: /refund request details/i })).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    // `exact` — the page also has an H2 "Refund request details", and a
    // substring match resolved to both, failing on strict mode rather than on
    // anything being wrong.
    await expect(page.getByText("Request details", { exact: true })).toBeVisible();
    await expect(page.getByText("Before you submit")).toBeVisible();
  });

  test("support-request shows step 1 with six issue cards", async ({ page }) => {
    await page.goto("/support-request");
    await expect(page.getByRole("heading", { name: /what do you need help with/i })).toBeVisible();
    await expect(page.getByText("Step 1 of 2")).toBeVisible();
    await expect(page.getByText("I can't access my course")).toBeVisible();
    await expect(page.getByText("I was charged twice")).toBeVisible();
    await expect(page.getByText("Other")).toBeVisible();
  });

  test("support-request deep link opens step 2", async ({ page }) => {
    await page.goto("/support-request?issue=wrong_course");
    await expect(page.getByText("Step 2 of 2")).toBeVisible();
    await expect(page.getByText("How we fix this")).toBeVisible();
    await expect(page.getByRole("button", { name: /change issue/i })).toBeVisible();
    // The wizard no longer renders a "Tell us where to reply" heading; the reply
    // fields are labelled directly. Asserting the fields is what this line meant
    // — a heading is copy, a labelled input is the contract.
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
  });

  test("change issue returns to step 1", async ({ page }) => {
    await page.goto("/support-request?issue=access");
    await page.getByRole("button", { name: /change issue/i }).click();
    await expect(page.getByText("Step 1 of 2")).toBeVisible();
    await expect(page.getByRole("heading", { name: /what do you need help with/i })).toBeVisible();
  });

  test("issue gate links to support-request with issue param", async ({ page }) => {
    await page.goto("/cancellations");
    const link = page.getByRole("link", { name: /charged twice/i });
    await expect(link).toHaveAttribute("href", /support-request\?issue=duplicate_charge/);
  });
});
