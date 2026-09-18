import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CertPageContent } from "@/types/certificate";

/**
 * The promo banner's destination is CMS-authored ("Link URL (optional)" on the
 * certificate page), so the service normalises it before a component ever sees it:
 * a backend-origin URL becomes a path, and anything that is not an http(s) URL or
 * a site path is dropped rather than rendered as an executable `href`.
 */

const serverFetch = vi.fn();

vi.mock("@/lib/api/server", () => ({
  serverFetch: (...args: unknown[]) => serverFetch(...args),
}));

const { certificateService } = await import("@/lib/services/certificate");

function page(link: unknown): CertPageContent {
  return {
    hero: { heading: "", text: "", benefits: [], images: [] },
    orderSection: { heading: "" },
    promoBanner: {
      image: { url: "https://cdn.test/promo.jpg", alt: "" },
      heading: "Premium Access",
      link: link as string,
    },
  };
}

beforeEach(() => {
  serverFetch.mockReset();
});

describe("certificateService.getPage — promo banner link", () => {
  it("keeps a site-relative path", async () => {
    serverFetch.mockResolvedValue(page("/pricing"));
    const result = await certificateService.getPage();
    expect(result.promoBanner.link).toBe("/pricing");
  });

  it("turns a WordPress-origin URL into a path so the banner stays on the frontend", async () => {
    serverFetch.mockResolvedValue(page("http://localhost/pricing/"));
    const result = await certificateService.getPage();
    expect(result.promoBanner.link).toBe("/pricing/");
  });

  it("leaves a genuinely third-party URL alone", async () => {
    serverFetch.mockResolvedValue(page("https://partner.example/offer"));
    const result = await certificateService.getPage();
    expect(result.promoBanner.link).toBe("https://partner.example/offer");
  });

  it.each([
    ["javascript:alert(1)"],
    ["JavaScript:alert(1)"],
    ["  javascript:alert(1)  "],
    ["data:text/html,<script>alert(1)</script>"],
    ["vbscript:msgbox(1)"],
    // Protocol-relative: someone else's origin wearing a path's clothes.
    ["//evil.test/steal"],
  ])("drops an unsafe scheme: %s", async (link) => {
    serverFetch.mockResolvedValue(page(link));
    const result = await certificateService.getPage();
    expect(result.promoBanner.link).toBe("");
  });

  it("survives a response with no link at all", async () => {
    serverFetch.mockResolvedValue(page(undefined));
    const result = await certificateService.getPage();
    expect(result.promoBanner.link).toBe("");
    // …and the rest of the banner is untouched.
    expect(result.promoBanner.heading).toBe("Premium Access");
    expect(result.promoBanner.image?.url).toBe("https://cdn.test/promo.jpg");
  });
});
