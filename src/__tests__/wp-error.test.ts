import { describe, it, expect } from "vitest";
import { sanitizeWpErrorMessage } from "@/lib/api/error";

describe("sanitizeWpErrorMessage", () => {
  it("replaces WP critical-error HTML pages with a clean fallback", () => {
    const fatal =
      '<p>There has been a critical error on this website.</p><p><a href="https://wordpress.org/documentation/article/faq-troubleshooting/">Learn more about troubleshooting WordPress.</a></p>';
    expect(sanitizeWpErrorMessage(fatal)).toBe(
      "Something went wrong on our end. Please try again.",
    );
  });

  it("strips leaked PHP notices / fatals with file paths", () => {
    const notice =
      "<br /><b>Warning</b>: foo has no effect in <b>/var/www/plugin.php</b> on line 12 in";
    expect(sanitizeWpErrorMessage(notice, "Invalid credentials")).toBe("Invalid credentials");
  });

  it("passes through legitimate short WP auth errors (with inline HTML)", () => {
    const msg = "<strong>Error:</strong> The password you entered is incorrect.";
    expect(sanitizeWpErrorMessage(msg)).toBe(msg);
  });

  it("returns the fallback for empty/whitespace input", () => {
    expect(sanitizeWpErrorMessage("")).toBe("Something went wrong on our end. Please try again.");
    expect(sanitizeWpErrorMessage("   ", "x")).toBe("x");
    expect(sanitizeWpErrorMessage(undefined, "y")).toBe("y");
  });
});
