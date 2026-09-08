import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ParsedHtml } from "@/components/ui/parsed-html";

// vitest.config.ts sets:
//   NEXT_PUBLIC_WP_API_URL  = http://localhost        (backend origin)
//   NEXT_PUBLIC_SITE_URL    = http://localhost:3000   (frontend origin)
const WP = "http://localhost";

/**
 * jsdom resolves a root-relative `href` against the document origin when read
 * as a property, so every assertion reads the raw attribute instead.
 */
function renderContent(html: string): HTMLElement {
  const { container } = render(<ParsedHtml as="div" content={html} />);
  return container;
}

const anchor = (container: HTMLElement) => container.querySelector("a")!;

describe("ParsedHtml — in-content links", () => {
  it("rewrites a backend permalink onto the frontend", () => {
    const c = renderContent(`<p>See <a href="${WP}/course/first-aid/">the course</a>.</p>`);
    expect(anchor(c).getAttribute("href")).toBe("/course/first-aid/");
  });

  it("preserves query and fragment while rewriting", () => {
    const c = renderContent(`<a href="${WP}/blog/x/?utm=1#s">x</a>`);
    expect(anchor(c).getAttribute("href")).toBe("/blog/x/?utm=1#s");
  });

  it("leaves relative and fragment-only links untouched", () => {
    expect(anchor(renderContent(`<a href="/courses">x</a>`)).getAttribute("href")).toBe("/courses");
    expect(anchor(renderContent(`<a href="#values">x</a>`)).getAttribute("href")).toBe("#values");
  });

  it("leaves mailto and tel links untouched", () => {
    const c = renderContent(`<a href="mailto:hi@trainingexcellence.org.uk">email</a>`);
    expect(anchor(c).getAttribute("href")).toBe("mailto:hi@trainingexcellence.org.uk");
  });
});

describe("ParsedHtml — functional backend URLs", () => {
  it("leaves an image source on the backend", () => {
    const src = `${WP}/wp-content/uploads/2026/07/hero.jpg`;
    const c = renderContent(`<img src="${src}" alt="Hero" />`);
    expect(c.querySelector("img")!.getAttribute("src")).toBe(src);
  });

  it("leaves an iframe embed on the backend", () => {
    const src = `${WP}/wp-content/plugins/x/player.html`;
    const c = renderContent(`<iframe src="${src}"></iframe>`);
    expect(c.querySelector("iframe")!.getAttribute("src")).toBe(src);
  });

  it("leaves an uploaded file download on the backend", () => {
    const pdf = `${WP}/wp-content/uploads/2026/07/handbook.pdf`;
    expect(anchor(renderContent(`<a href="${pdf}">Handbook</a>`)).getAttribute("href")).toBe(pdf);
  });

  it("leaves an add-to-cart link on the backend", () => {
    const url = `${WP}/?add-to-cart=69664`;
    expect(anchor(renderContent(`<a href="${url}">Buy</a>`)).getAttribute("href")).toBe(url);
  });

  it("rewrites a bare cart permalink", () => {
    const c = renderContent(`<a href="${WP}/cart/">Your cart</a>`);
    expect(anchor(c).getAttribute("href")).toBe("/cart/");
  });
});

describe("ParsedHtml — third-party links", () => {
  it("opens an external link in a new tab with a safe rel", () => {
    const a = anchor(renderContent(`<a href="https://stripe.com/pay">Pay</a>`));
    expect(a.getAttribute("href")).toBe("https://stripe.com/pay");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toContain("noopener");
    expect(a.getAttribute("rel")).toContain("noreferrer");
  });

  it("keeps an author-supplied rel alongside the safe tokens", () => {
    const a = anchor(
      renderContent(`<a href="https://partner.example/x" rel="nofollow sponsored">x</a>`),
    );
    const rel = (a.getAttribute("rel") ?? "").split(" ");
    expect(rel).toEqual(
      expect.arrayContaining(["nofollow", "sponsored", "noopener", "noreferrer"]),
    );
  });

  it("does not open a rewritten internal link in a new tab", () => {
    const a = anchor(renderContent(`<a href="${WP}/course/first-aid/">Course</a>`));
    expect(a.getAttribute("target")).toBeNull();
  });
});
