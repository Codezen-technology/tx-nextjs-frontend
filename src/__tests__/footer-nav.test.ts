import { describe, it, expect } from "vitest";
import { buildNavColumns } from "@/components/layout/footer";

/**
 * QA-HOME-A9 (`R-HOME-1920-15`) — the three removed footer links.
 *
 * The E2E check cannot prove this: locally the footer endpoint returns
 * `nav: []`, which renders no menu at all, so an assertion that the three links
 * are absent passes on empty data and would keep passing if the filter were
 * deleted. The payload below is the shape **prod** actually returns, captured
 * from `https://trainingexcellence.org.uk/wp-json/lms-backend/v1/footer` on
 * 2026-08-14. That is the data the filter has to survive.
 */
const PROD_NAV = {
  about: [
    { label: "About us", href: "/about" },
    { label: "Work for us", href: "/careers" },
    { label: "Resources", href: "/resources", badge: "New" },
    { label: "Force for Good", href: "/force-for-good" },
    { label: "Reviews", href: "/reviews" },
  ],
  support: [
    { label: "Help and FAQs", href: "/help" },
    { label: "Contact us", href: "/contact" },
    { label: "Verify certificate", href: "/verify-certificate" },
    { label: "Cancellations and refunds", href: "/cancellations" },
    { label: "Policies and terms of use", href: "/policies" },
  ],
};

const hrefs = (cols: ReturnType<typeof buildNavColumns>) =>
  cols.flatMap((c) => c.links.map((l) => l.href));

describe("footer nav — removed links", () => {
  it("drops the three removed destinations from the prod CMS payload", () => {
    const rendered = hrefs(buildNavColumns(PROD_NAV));

    expect(rendered).not.toContain("/careers");
    expect(rendered).not.toContain("/resources");
    expect(rendered).not.toContain("/force-for-good");
  });

  it("keeps every other CMS link, in order", () => {
    const cols = buildNavColumns(PROD_NAV);

    expect(cols[0].links.map((l) => l.href)).toEqual(["/about", "/reviews"]);
    expect(cols[1].links.map((l) => l.href)).toEqual([
      "/help",
      "/contact",
      "/verify-certificate",
      "/cancellations",
      "/policies",
    ]);
  });

  it("drops them from a flat WP menu, even on an unrecognised origin", () => {
    // `toFrontendPath` only strips an origin it knows, so these stay absolute —
    // which is exactly the case a label- or string-equality filter would miss.
    const rendered = hrefs(
      buildNavColumns([
        { title: "Resources", url: "https://wp.test/resources" },
        { title: "Reviews", url: "https://wp.test/reviews" },
        { title: "Force for Good", url: "https://wp.test/force-for-good" },
      ] as never),
    );

    expect(rendered).toEqual(["https://wp.test/reviews"]);
  });

  it("drops them from the built-in fallback", () => {
    const rendered = hrefs(buildNavColumns(undefined));

    expect(rendered).not.toContain("/careers");
    expect(rendered).not.toContain("/resources");
    expect(rendered).not.toContain("/force-for-good");
    expect(rendered).toContain("/about-us");
  });

  it("ignores the label, matches the destination", () => {
    // An editor renaming a removed item must not resurrect it.
    const rendered = hrefs(
      buildNavColumns({ about: [{ label: "Careers", href: "/careers/" }], support: [] }),
    );

    expect(rendered).toEqual([]);
  });
});
