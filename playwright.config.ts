import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * Load `.env.local` into the test process.
 *
 * Specs that need a course slug or a purchasable product read
 * `NEXT_PUBLIC_WP_API_URL` to reach WordPress directly, exactly as the browser
 * does. Without it they `test.skip` — and a skip is indistinguishable from a
 * pass in the summary line, which is how the three `QA-CHECK-*` assertions and
 * the two `course-detail` head-tag tests sat silently inert in every full run
 * while their rows read FIXED with a test reference.
 *
 * The runbook told humans to prefix the command with `set -a; . ./.env.local`.
 * A config that loads it cannot be forgotten. Existing environment wins, so CI
 * and one-off overrides still take precedence.
 */
function loadEnvLocal() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!m) continue;
      const key = m[1];
      if (process.env[key] !== undefined) continue;
      process.env[key] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // No .env.local — CI supplies the environment directly.
  }
}
loadEnvLocal();

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  // The QA pass reports at 1920 / 1280 / 440, so those are the widths the suite
  // has to be able to run at. `chromium` stays as the default 1280 project so
  // existing specs and `--project=chromium` invocations keep working.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "desktop-1920",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: "mobile-440",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 440, height: 956 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
