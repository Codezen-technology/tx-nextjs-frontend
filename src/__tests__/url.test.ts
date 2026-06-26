import { describe, it, expect } from "vitest";
import {
  isExternalUrl,
  isWpBackendUrl,
  replaceWpOrigin,
  toFrontendPath,
  toFrontendUrl,
} from "@/lib/utils/url";

// vitest.config.ts sets:
//   NEXT_PUBLIC_WP_API_URL  = http://localhost        (backend origin)
//   NEXT_PUBLIC_SITE_URL    = http://localhost:3000   (frontend origin)
const WP = "http://localhost";
const SITE = "http://localhost:3000";

describe("isWpBackendUrl", () => {
  it("true for backend-origin absolute URLs", () => {
    expect(isWpBackendUrl(`${WP}/product/b2b-lifetime-access/`)).toBe(true);
  });
  it("false for frontend, external, relative, and empty", () => {
    expect(isWpBackendUrl(`${SITE}/product/x`)).toBe(false);
    expect(isWpBackendUrl("https://stripe.com/pay")).toBe(false);
    expect(isWpBackendUrl("/courses")).toBe(false);
    expect(isWpBackendUrl(null)).toBe(false);
    expect(isWpBackendUrl(undefined)).toBe(false);
  });
});

describe("isExternalUrl", () => {
  it("true only for genuinely third-party origins", () => {
    expect(isExternalUrl("https://stripe.com/pay")).toBe(true);
  });
  it("false for backend, frontend, relative, and empty", () => {
    expect(isExternalUrl(`${WP}/product/x`)).toBe(false);
    expect(isExternalUrl(`${SITE}/product/x`)).toBe(false);
    expect(isExternalUrl("/courses")).toBe(false);
    expect(isExternalUrl("")).toBe(false);
    expect(isExternalUrl(null)).toBe(false);
  });
});

describe("toFrontendUrl", () => {
  it("rewrites the backend origin to the frontend origin", () => {
    expect(toFrontendUrl(`${WP}/product/x/`)).toBe(`${SITE}/product/x/`);
  });
  it("preserves search and hash", () => {
    expect(toFrontendUrl(`${WP}/product/x/?a=1&b=2#section`)).toBe(
      `${SITE}/product/x/?a=1&b=2#section`,
    );
  });
  it("leaves external, frontend, relative, and empty untouched", () => {
    expect(toFrontendUrl("https://stripe.com/pay")).toBe("https://stripe.com/pay");
    expect(toFrontendUrl(`${SITE}/x`)).toBe(`${SITE}/x`);
    expect(toFrontendUrl("/courses")).toBe("/courses");
    expect(toFrontendUrl("")).toBe("");
    expect(toFrontendUrl(null)).toBe("");
  });
});

describe("toFrontendPath", () => {
  it("returns a root-relative path for backend URLs", () => {
    expect(toFrontendPath(`${WP}/product/x/?a=1#h`)).toBe("/product/x/?a=1#h");
  });
  it("returns a root-relative path for same-site URLs", () => {
    expect(toFrontendPath(`${SITE}/dashboard?tab=1`)).toBe("/dashboard?tab=1");
  });
  it("keeps genuinely external URLs absolute", () => {
    expect(toFrontendPath("https://stripe.com/pay")).toBe("https://stripe.com/pay");
  });
  it("leaves relative and empty untouched", () => {
    expect(toFrontendPath("/courses")).toBe("/courses");
    expect(toFrontendPath("")).toBe("");
    expect(toFrontendPath(null)).toBe("");
  });
});

describe("replaceWpOrigin", () => {
  it("swaps every backend-origin occurrence inside a string", () => {
    const json = `{"@id":"${WP}/course/x","url":"${WP}/course/x/lesson"}`;
    expect(replaceWpOrigin(json)).toBe(
      `{"@id":"${SITE}/course/x","url":"${SITE}/course/x/lesson"}`,
    );
  });
  it("returns the input unchanged when there is nothing to swap", () => {
    expect(replaceWpOrigin("no urls here")).toBe("no urls here");
    expect(replaceWpOrigin("")).toBe("");
  });
});
