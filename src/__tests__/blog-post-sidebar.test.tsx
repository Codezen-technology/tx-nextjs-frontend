import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BlogPostSidebar } from "@/components/blog/blog-post-sidebar";
import { parseToc } from "@/lib/utils/toc";

const TOC = [
  { id: "what-is-haccp", text: "What is HACCP", level: 2 },
  { id: "who-needs-it", text: "Who needs it", level: 2 },
];

describe("BlogPostSidebar — Table of Contents anchors", () => {
  let scrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // jsdom has no layout engine; IntersectionObserver and scrollTo are stubbed
    // so the click path (the thing under test) can be observed.
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    );
    scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);

    document.body.innerHTML = TOC.map((t) => `<h2 id="${t.id}">${t.text}</h2>`).join("");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("scrolls to the clicked heading instead of leaving the page put", () => {
    render(<BlogPostSidebar toc={TOC} />);
    fireEvent.click(screen.getByRole("link", { name: /Who needs it/ }));

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth", top: expect.any(Number) }),
    );
  });

  it("offsets the target so it does not land under the sticky header", () => {
    const target = document.getElementById("who-needs-it")!;
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({ top: 1000 } as DOMRect);
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });

    render(<BlogPostSidebar toc={TOC} />);
    fireEvent.click(screen.getByRole("link", { name: /Who needs it/ }));

    const { top } = scrollTo.mock.calls[0][0] as { top: number };
    expect(top).toBeLessThan(1000);
    expect(top).toBeGreaterThan(0);
  });

  it("keeps the href so the link is shareable and works without JS", () => {
    render(<BlogPostSidebar toc={TOC} />);
    expect(screen.getByRole("link", { name: /What is HACCP/ })).toHaveAttribute(
      "href",
      "#what-is-haccp",
    );
  });

  it("never scrolls above the top of the document", () => {
    const target = document.getElementById("what-is-haccp")!;
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({ top: 10 } as DOMRect);
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });

    render(<BlogPostSidebar toc={TOC} />);
    fireEvent.click(screen.getByRole("link", { name: /What is HACCP/ }));

    expect((scrollTo.mock.calls[0][0] as { top: number }).top).toBe(0);
  });

  it("targets IDs that parseToc actually injects into the article HTML", () => {
    const { toc, content } = parseToc("<h2>Who needs it</h2><p>x</p>");
    expect(toc[0].id).toBe("who-needs-it");
    expect(content).toContain('id="who-needs-it"');
  });
});
