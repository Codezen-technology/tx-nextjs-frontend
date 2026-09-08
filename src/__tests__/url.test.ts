import { describe, it, expect, vi } from "vitest";
import {
  isExternalUrl,
  isFunctionalWpUrl,
  isWpBackendUrl,
  replaceWpOrigin,
  rewriteContentHref,
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

describe("isFunctionalWpUrl", () => {
  it("true for wp-* paths the frontend cannot serve", () => {
    expect(isFunctionalWpUrl(`${WP}/wp-content/uploads/2026/07/handbook.pdf`)).toBe(true);
    expect(isFunctionalWpUrl(`${WP}/wp-includes/js/x.js`)).toBe(true);
    expect(isFunctionalWpUrl(`${WP}/wp-json/wp/v2/posts`)).toBe(true);
    expect(isFunctionalWpUrl(`${WP}/wp-admin/edit.php`)).toBe(true);
    expect(isFunctionalWpUrl(`${WP}/wp-login.php?redirect_to=/x`)).toBe(true);
    expect(isFunctionalWpUrl(`${WP}/wp-admin/admin-ajax.php?action=x`)).toBe(true);
  });
  it("true for WooCommerce transactional URLs", () => {
    expect(isFunctionalWpUrl(`${WP}/?add-to-cart=69664`)).toBe(true);
    expect(isFunctionalWpUrl(`${WP}/checkout/order-pay/123/?pay_for_order=true`)).toBe(true);
    expect(isFunctionalWpUrl(`${WP}/checkout/order-received/123/`)).toBe(true);
    expect(isFunctionalWpUrl(`${WP}/checkout/?key=wc_order_abc123`)).toBe(true);
    expect(isFunctionalWpUrl(`${WP}/cart/?remove_item=abc`)).toBe(true);
  });
  it("false for bare cart and checkout permalinks the frontend serves", () => {
    expect(isFunctionalWpUrl(`${WP}/cart/`)).toBe(false);
    expect(isFunctionalWpUrl(`${WP}/checkout/`)).toBe(false);
  });
  it("false for content, frontend, external, relative, and empty", () => {
    expect(isFunctionalWpUrl(`${WP}/course/first-aid/`)).toBe(false);
    expect(isFunctionalWpUrl(`${SITE}/wp-content/uploads/x.pdf`)).toBe(false);
    expect(isFunctionalWpUrl("https://stripe.com/wp-admin")).toBe(false);
    expect(isFunctionalWpUrl("/wp-content/uploads/x.pdf")).toBe(false);
    expect(isFunctionalWpUrl(null)).toBe(false);
  });
});

describe("rewriteContentHref", () => {
  it("rewrites a backend content permalink to a root-relative frontend path", () => {
    expect(rewriteContentHref(`${WP}/course/first-aid/`)).toBe("/course/first-aid/");
  });
  it("preserves query and fragment while rewriting", () => {
    expect(rewriteContentHref(`${WP}/blog/x/?utm=1#section`)).toBe("/blog/x/?utm=1#section");
  });
  it("rewrites a protocol-relative backend link", () => {
    expect(rewriteContentHref("//localhost/course/first-aid/")).toBe("/course/first-aid/");
  });
  it("rewrites a bare backend cart permalink", () => {
    expect(rewriteContentHref(`${WP}/cart/`)).toBe("/cart/");
  });
  it("leaves relative, fragment-only, and empty hrefs untouched", () => {
    expect(rewriteContentHref("/courses")).toBe("/courses");
    expect(rewriteContentHref("about-us")).toBe("about-us");
    expect(rewriteContentHref("#section-2")).toBe("#section-2");
    expect(rewriteContentHref("")).toBe("");
  });
  it("leaves non-HTTP schemes untouched", () => {
    expect(rewriteContentHref("mailto:hi@trainingexcellence.org.uk")).toBe(
      "mailto:hi@trainingexcellence.org.uk",
    );
    expect(rewriteContentHref("tel:+441943605050")).toBe("tel:+441943605050");
  });
  it("leaves functional backend URLs on the backend", () => {
    const pdf = `${WP}/wp-content/uploads/2026/07/handbook.pdf`;
    expect(rewriteContentHref(pdf)).toBe(pdf);
    const addToCart = `${WP}/?add-to-cart=69664`;
    expect(rewriteContentHref(addToCart)).toBe(addToCart);
    const orderPay = `${WP}/checkout/order-pay/123/?key=wc_order_abc`;
    expect(rewriteContentHref(orderPay)).toBe(orderPay);
  });
  it("leaves frontend and third-party URLs untouched", () => {
    expect(rewriteContentHref(`${SITE}/course/x`)).toBe(`${SITE}/course/x`);
    expect(rewriteContentHref("https://stripe.com/pay")).toBe("https://stripe.com/pay");
  });
});

/**
 * The origins are module-scope constants read from env, so these cases need a
 * fresh module instance per configuration rather than a runtime override.
 */
async function loadUrlModuleWith(wp: string, site: string) {
  vi.resetModules();
  vi.doMock("@/lib/env", () => ({ env: { WP_API_URL: wp, SITE_URL: site } }));
  const mod = await import("@/lib/utils/url");
  vi.doUnmock("@/lib/env");
  return mod;
}

describe("rewriteContentHref origin configuration", () => {
  it("is a no-op when backend and frontend share an origin", async () => {
    const { rewriteContentHref: rewrite } = await loadUrlModuleWith(
      "https://example.test",
      "https://example.test",
    );
    expect(rewrite("https://example.test/course/x/")).toBe("https://example.test/course/x/");
  });

  it("is a no-op when an origin is unset", async () => {
    const { rewriteContentHref: rewrite } = await loadUrlModuleWith("", "https://example.test");
    expect(rewrite("https://cms.example.test/course/x/")).toBe(
      "https://cms.example.test/course/x/",
    );
  });

  it("is a no-op when an origin is not a parseable URL", async () => {
    const { rewriteContentHref: rewrite } = await loadUrlModuleWith(
      "cms.example.test",
      "https://example.test",
    );
    expect(rewrite("https://cms.example.test/course/x/")).toBe(
      "https://cms.example.test/course/x/",
    );
  });
});
