import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { normalizeFloatingBar, mergeSettings } from "@/lib/services/settings";
import { SiteSettingsProvider } from "@/components/providers/site-settings-provider";
import { SiteFloatingBar } from "@/components/layout/site-floating-bar";
import type { FloatingBar, SiteSettings } from "@/types/settings";

/**
 * Contract under test: `floating_bar` on `GET /settings`, owned by
 * `wp-lms-backend-rest-api` — see `docs/SETTINGS_API.md` there.
 *
 * The backend already applies the substantive rules (null when unconfigured or
 * off, markup stripped, unsafe CTA dropped), so these cover our side of the
 * seam: that we never render a bar with nothing to say, that the CTA is
 * all-or-nothing, and that `dismissible` / `dismiss_key` are honoured the way
 * the contract says.
 *
 * `vitest.config.ts` pins the two origins the URL helpers are built from:
 *   WP backend → http://localhost      frontend → http://localhost:3000
 */
const WP_URL = "http://localhost/contact";
const EXTERNAL_URL = "https://status.example.test/incidents";

const MESSAGE = "We're upgrading this site.";
const KEY = "3f9c1a2b7e04";
const STORAGE_KEY = "lms-floating-bar-dismissed";

describe("normalizeFloatingBar — what counts as no bar", () => {
  it("returns undefined when the site has no bar", () => {
    expect(normalizeFloatingBar(null)).toBeUndefined();
  });

  it("returns undefined when the key is missing entirely", () => {
    expect(normalizeFloatingBar(undefined)).toBeUndefined();
  });

  // The backend already guarantees a non-empty message, so this is the guard
  // against a stale plugin build or a WP-side filter, not a second opinion.
  it("returns undefined for a bar whose message is empty", () => {
    expect(normalizeFloatingBar({ message: "", dismiss_key: KEY })).toBeUndefined();
  });

  it("returns undefined for a bar whose message is whitespace only", () => {
    expect(normalizeFloatingBar({ message: "   \n ", dismiss_key: KEY })).toBeUndefined();
  });
});

describe("normalizeFloatingBar — content", () => {
  it("keeps the message and dismissal key", () => {
    expect(normalizeFloatingBar({ message: MESSAGE, dismissible: true, dismiss_key: KEY })).toEqual(
      { message: MESSAGE, dismissKey: KEY },
    );
  });

  it("decodes entities the backend's tag-stripping leaves behind", () => {
    const bar = normalizeFloatingBar({
      message: "Courses &amp; certificates are moving &#8212; bear with us",
      dismiss_key: KEY,
    });
    expect(bar?.message).toBe("Courses & certificates are moving — bear with us");
  });

  it("passes a site-relative CTA href through unchanged", () => {
    const bar = normalizeFloatingBar({
      message: MESSAGE,
      cta: { label: "See dates", href: "/courses" },
      dismiss_key: KEY,
    });
    expect(bar?.cta).toEqual({ href: "/courses", label: "See dates" });
  });

  it("rewrites a WP-origin CTA href to a frontend path", () => {
    const bar = normalizeFloatingBar({
      message: MESSAGE,
      cta: { label: "Report an issue", href: WP_URL },
      dismiss_key: KEY,
    });
    expect(bar?.cta?.href).toBe("/contact");
  });

  it("leaves a genuinely external CTA href alone", () => {
    const bar = normalizeFloatingBar({
      message: MESSAGE,
      cta: { label: "Status page", href: EXTERNAL_URL },
      dismiss_key: KEY,
    });
    expect(bar?.cta?.href).toBe(EXTERNAL_URL);
  });

  // "Losing a link is not a reason to withhold the notice" — the backend spec's
  // words. Either half alone is unusable, and the message still shows.
  it("drops a CTA that has an href but no label", () => {
    const bar = normalizeFloatingBar({
      message: MESSAGE,
      cta: { href: "/courses" },
      dismiss_key: KEY,
    });
    expect(bar?.cta).toBeUndefined();
    expect(bar?.message).toBe(MESSAGE);
  });

  it("drops a CTA that has a label but no href", () => {
    const bar = normalizeFloatingBar({
      message: MESSAGE,
      cta: { label: "See dates" },
      dismiss_key: KEY,
    });
    expect(bar?.cta).toBeUndefined();
    expect(bar?.message).toBe(MESSAGE);
  });

  // Security: `new URL("javascript:alert(1)")` parses, with an origin of
  // "null" — which reads as "not our origin" to isExternalUrl() and would land
  // an executable href on every visitor-facing page. Anyone who can write the
  // WP option, or add a filter on the WP side, would have script execution.
  it.each([
    ["javascript:alert(1)"],
    ["JavaScript:alert(1)"],
    ["  javascript:alert(1)  "],
    ["data:text/html,<script>alert(1)</script>"],
    ["vbscript:msgbox(1)"],
    ["//evil.test/steal"],
  ])("drops a CTA whose href uses an unsafe scheme: %s", (href) => {
    const bar = normalizeFloatingBar({
      message: MESSAGE,
      cta: { label: "Click me", href },
      dismiss_key: KEY,
    });
    expect(bar?.cta).toBeUndefined();
    // Dropping the link is not a reason to withhold the notice.
    expect(bar?.message).toBe(MESSAGE);
  });

  it("treats a null CTA as no CTA", () => {
    expect(
      normalizeFloatingBar({ message: MESSAGE, cta: null, dismiss_key: KEY })?.cta,
    ).toBeUndefined();
  });

  // Mirrors the backend default: an absent `dismissible` means dismissible.
  it("keeps the key when the backend omits dismissible", () => {
    expect(normalizeFloatingBar({ message: MESSAGE, dismiss_key: KEY })?.dismissKey).toBe(KEY);
  });

  it("drops the key on an explicit dismissible: false", () => {
    expect(
      normalizeFloatingBar({ message: MESSAGE, dismissible: false, dismiss_key: KEY })?.dismissKey,
    ).toBeUndefined();
  });

  // Dismissible with nothing to record the dismissal against is not
  // dismissible — the control would come straight back on the next page load.
  it("drops the key when the backend omits dismiss_key", () => {
    expect(
      normalizeFloatingBar({ message: MESSAGE, dismissible: true })?.dismissKey,
    ).toBeUndefined();
  });
});

describe("mergeSettings — the raw shape never reaches components", () => {
  it("normalizes the bar rather than passing the API object through", () => {
    const merged = mergeSettings({
      floating_bar: {
        message: "Courses &amp; certificates are moving",
        cta: { label: "Report an issue", href: WP_URL },
        dismissible: false,
        dismiss_key: KEY,
      },
    });
    expect(merged.floating_bar).toEqual({
      message: "Courses & certificates are moving",
      cta: { href: "/contact", label: "Report an issue" },
    });
  });

  it("resolves a null bar to undefined", () => {
    expect(mergeSettings({ floating_bar: null }).floating_bar).toBeUndefined();
  });

  it("leaves the bar undefined when settings fall back to env defaults", () => {
    expect(mergeSettings({}).floating_bar).toBeUndefined();
  });
});

function renderBar(bar?: Partial<FloatingBar>) {
  const floating_bar = bar ? ({ message: MESSAGE, ...bar } as FloatingBar) : undefined;
  return render(
    <SiteSettingsProvider settings={{ ...mergeSettings({}), floating_bar } as SiteSettings}>
      <SiteFloatingBar />
    </SiteSettingsProvider>,
  );
}

const bar = () => screen.queryByRole("complementary", { name: "Site notice" });
const dismissBtn = () => screen.queryByRole("button", { name: "Dismiss this notice" });

describe("SiteFloatingBar", () => {
  beforeEach(() => window.localStorage.clear());

  it("renders nothing when there is no bar", () => {
    const { container } = renderBar(undefined);
    expect(bar()).toBeNull();
    // Not merely hidden — no reserved vertical space anywhere on the page.
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the message inside a labelled complementary landmark", () => {
    renderBar({ message: MESSAGE });
    expect(bar()).not.toBeNull();
    expect(screen.getByText(MESSAGE)).toBeTruthy();
  });

  it("renders no CTA when the bar carries none", () => {
    renderBar({ message: MESSAGE });
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders an internal CTA in the same tab", () => {
    renderBar({ cta: { href: "/courses", label: "See dates" } });
    const link = screen.getByRole("link", { name: "See dates" });
    expect(link.getAttribute("href")).toBe("/courses");
    expect(link.getAttribute("target")).toBeNull();
  });

  it("opens a third-party CTA in a new tab with a safe rel", () => {
    renderBar({ cta: { href: EXTERNAL_URL, label: "Status page" } });
    const link = screen.getByRole("link", { name: "Status page" });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("renders the message as text, not markup", () => {
    renderBar({ message: "<strong>Heads up</strong> we are migrating" });
    expect(bar()?.querySelector("strong")).toBeNull();
    expect(screen.getByText("<strong>Heads up</strong> we are migrating")).toBeTruthy();
  });
});

describe("SiteFloatingBar — dismissal", () => {
  beforeEach(() => window.localStorage.clear());

  it("offers no dismiss control when the bar carries no key", () => {
    renderBar({ message: MESSAGE });
    expect(dismissBtn()).toBeNull();
  });

  it("offers a dismiss control when the bar carries a key", () => {
    renderBar({ dismissKey: KEY });
    expect(dismissBtn()).not.toBeNull();
  });

  it("hides the whole bar when dismissed, not just the button", () => {
    renderBar({ dismissKey: KEY });
    fireEvent.click(dismissBtn()!);
    expect(bar()).toBeNull();
  });

  it("stays hidden on the next page load, keyed on the dismiss key", () => {
    const first = renderBar({ dismissKey: KEY });
    fireEvent.click(dismissBtn()!);
    first.unmount();

    renderBar({ dismissKey: KEY });
    expect(bar()).toBeNull();
  });

  // The whole point of a content-derived key: dismissing January's notice must
  // not hide February's.
  it("comes back when the copy changes, because the key changes with it", () => {
    const first = renderBar({ dismissKey: "january00key" });
    fireEvent.click(dismissBtn()!);
    first.unmount();

    renderBar({ dismissKey: "february0key", message: "New notice" });
    expect(bar()).not.toBeNull();
    expect(screen.getByText("New notice")).toBeTruthy();
  });

  it("shows a non-dismissible bar even if a key was somehow stored", () => {
    window.localStorage.setItem(STORAGE_KEY, KEY);
    renderBar({ message: MESSAGE });
    expect(bar()).not.toBeNull();
  });

  // A bar with no key must not touch storage at all — that is what makes its
  // markup a pure function of the settings response.
  it("does not read storage for a non-dismissible bar", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    renderBar({ message: MESSAGE });
    expect(getItem).not.toHaveBeenCalled();
    getItem.mockRestore();
  });
});

describe("SiteFloatingBar — dismissal when storage is unavailable", () => {
  beforeEach(() => window.localStorage.clear());

  it("still hides the bar for this page view when the write is refused", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    renderBar({ dismissKey: KEY });
    fireEvent.click(dismissBtn()!);
    expect(bar()).toBeNull();

    setItem.mockRestore();
  });

  // Regression: a stale key from a previous notice is not null, so it cannot be
  // fallen through on. Reading storage alone can never express "dismissed here".
  it("hides the bar even when storage already holds a different notice's key", () => {
    window.localStorage.setItem(STORAGE_KEY, "januaryOldKey");
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    renderBar({ dismissKey: KEY });
    fireEvent.click(dismissBtn()!);
    expect(bar()).toBeNull();

    setItem.mockRestore();
  });

  it("does not crash when reading storage throws", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });

    renderBar({ dismissKey: KEY });
    expect(bar()).not.toBeNull();

    getItem.mockRestore();
  });
});
