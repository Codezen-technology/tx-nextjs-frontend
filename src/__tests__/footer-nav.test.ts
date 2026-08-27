import { describe, expect, it } from "vitest";
import { buildNavColumns, normaliseNavHref, FALLBACK_NAV_LINKS } from "@/lib/utils/footer-nav";
import type { WpNavItem } from "@/types/settings";

/** Vitest sets NEXT_PUBLIC_WP_API_URL=http://localhost (see vitest.config.ts). */
const WP = "http://localhost";

let nextId = 1;

function item(partial: Partial<WpNavItem> & { title: string; url: string }): WpNavItem {
  return {
    id: nextId++,
    slug: null,
    object_type: "page",
    object_id: 0,
    target: null,
    classes: [],
    description: null,
    menu_order: 0,
    // Children omit `items` entirely; sections get it from build_nav_tree().
    items: undefined,
    ...partial,
  };
}

/** The live site's footer menu: two headed sections. */
function liveMenu(): WpNavItem[] {
  return [
    item({
      title: "Quick links",
      url: "#",
      menu_order: 1,
      items: [
        item({ title: "About us", url: `${WP}/about-us/`, menu_order: 1 }),
        item({ title: "Write for us", url: `${WP}/write-for-us/`, menu_order: 2 }),
        item({ title: "Privacy Policy", url: `${WP}/privacy-policy/`, menu_order: 3 }),
        item({ title: "Terms & Conditions", url: `${WP}/terms-and-conditions/`, menu_order: 4 }),
      ],
    }),
    item({
      title: "Support",
      url: "#",
      menu_order: 2,
      items: [item({ title: "Contact us", url: `${WP}/contact-us/`, menu_order: 1 })],
    }),
  ];
}

const labelsOf = (links: { label: string }[]) => links.map((l) => l.label);

describe("buildNavColumns — nested backend menu", () => {
  it("renders each top-level section as a headed column of its children", () => {
    const cols = buildNavColumns(liveMenu());

    expect(cols).toHaveLength(2);
    expect(cols[0].header).toBe("Quick links");
    expect(labelsOf(cols[0].links)).toEqual([
      "About us",
      "Write for us",
      "Privacy Policy",
      "Terms & Conditions",
    ]);
    expect(cols[1].header).toBe("Support");
    expect(labelsOf(cols[1].links)).toEqual(["Contact us"]);
  });

  it("orders columns and their links by menu_order, not array position", () => {
    const nav = [
      item({
        title: "Second",
        url: "#",
        menu_order: 2,
        items: [
          item({ title: "B", url: `${WP}/b/`, menu_order: 2 }),
          item({ title: "A", url: `${WP}/a/`, menu_order: 1 }),
        ],
      }),
      item({
        title: "First",
        url: "#",
        menu_order: 1,
        items: [item({ title: "C", url: `${WP}/c/`, menu_order: 1 })],
      }),
    ];

    const cols = buildNavColumns(nav);

    expect(cols.map((c) => c.header)).toEqual(["First", "Second"]);
    expect(labelsOf(cols[1].links)).toEqual(["A", "B"]);
  });

  it("does not treat a section header as a link", () => {
    const cols = buildNavColumns(liveMenu());
    expect(labelsOf(cols[0].links)).not.toContain("Quick links");
  });
});

describe("buildNavColumns — flat menu", () => {
  it("renders childless top-level items as links split across two columns", () => {
    const nav = [
      item({ title: "About us", url: `${WP}/about-us/`, menu_order: 1 }),
      item({ title: "Reviews", url: `${WP}/reviews/`, menu_order: 2 }),
      item({ title: "Help", url: `${WP}/help/`, menu_order: 3 }),
      item({ title: "Contact us", url: `${WP}/contact-us/`, menu_order: 4 }),
    ];

    const cols = buildNavColumns(nav);

    expect(cols).toHaveLength(2);
    expect(cols.every((c) => c.header === undefined)).toBe(true);
    expect(labelsOf(cols[0].links)).toEqual(["About us", "Reviews"]);
    expect(labelsOf(cols[1].links)).toEqual(["Help", "Contact us"]);
  });

  it("keeps a mixed menu's loose links in their own unheaded column", () => {
    const nav = [
      item({ title: "Standalone", url: `${WP}/standalone/`, menu_order: 1 }),
      item({
        title: "Support",
        url: "#",
        menu_order: 2,
        items: [item({ title: "Contact us", url: `${WP}/contact-us/`, menu_order: 1 })],
      }),
    ];

    const cols = buildNavColumns(nav);

    expect(cols).toHaveLength(2);
    expect(cols[0].header).toBeUndefined();
    expect(labelsOf(cols[0].links)).toEqual(["Standalone"]);
    expect(cols[1].header).toBe("Support");
  });
});

describe("buildNavColumns — fallback", () => {
  const fallbackLabels = FALLBACK_NAV_LINKS.map((l) => l.label);

  const expectFallback = (cols: ReturnType<typeof buildNavColumns>) => {
    expect(cols.flatMap((c) => labelsOf(c.links))).toEqual(fallbackLabels);
    expect(cols.every((c) => c.links.length > 0)).toBe(true);
  };

  // The reported bug: an assigned-but-empty `footer-menu` returns `nav: []`,
  // which the old `if (!nav)` guard let through as two blank columns.
  it("falls back when the backend returns an empty nav array", () => {
    const cols = buildNavColumns([]);
    expectFallback(cols);
  });

  it("falls back when the footer request failed and nav is undefined", () => {
    expectFallback(buildNavColumns(undefined));
  });

  it("falls back when every section exists but contains no links", () => {
    const nav = [
      item({ title: "Quick links", url: "#", menu_order: 1, items: [] }),
      item({ title: "Support", url: "#", menu_order: 2, items: [] }),
    ];
    // Both sections are childless, so they'd otherwise become standalone links
    // pointing at "#" — which is not a destination.
    expectFallback(buildNavColumns(nav));
  });

  it("falls back when the legacy about/support shape is empty", () => {
    expectFallback(buildNavColumns({ about: [], support: [] }));
  });

  it("drops a legacy column whose links are all empty rather than leaving a bare header", () => {
    const cols = buildNavColumns({
      about: [{ href: "/about-us", label: "About us" }],
      support: [],
    });

    expect(cols).toHaveLength(1);
    expect(cols[0].header).toBe("About");
    expect(labelsOf(cols[0].links)).toEqual(["About us"]);
  });

  it("drops unrenderable legacy links and falls back when none survive", () => {
    expectFallback(buildNavColumns({ about: [{ href: "#", label: "Heading" }], support: [] }));
  });

  it("never emits an empty or header-only column", () => {
    const empties: Parameters<typeof buildNavColumns>[0][] = [
      [],
      undefined,
      { about: [], support: [] },
    ];
    for (const nav of empties) {
      const cols = buildNavColumns(nav);
      expect(cols.some((c) => c.links.length === 0)).toBe(false);
    }
  });
});

describe("normaliseNavHref", () => {
  it("rewrites a WP permalink to a root-relative frontend path", () => {
    expect(normaliseNavHref(`${WP}/about-us/`)).toBe("/about-us");
  });

  it("strips a trailing slash to avoid a redirect hop", () => {
    expect(normaliseNavHref("/terms-and-conditions/")).toBe("/terms-and-conditions");
  });

  it("preserves the bare root path", () => {
    expect(normaliseNavHref(`${WP}/`)).toBe("/");
  });

  it("preserves query and hash while still stripping the path's trailing slash", () => {
    expect(normaliseNavHref(`${WP}/help/?topic=refunds#faq`)).toBe("/help?topic=refunds#faq");
  });

  it("remaps a legacy slug that carries a query string", () => {
    expect(normaliseNavHref(`${WP}/contact/?ref=footer`)).toBe("/contact-us?ref=footer");
  });

  it("decodes entity-encoded menu titles", () => {
    const nav = [
      item({
        title: "Legal &amp; policies",
        url: "#",
        menu_order: 1,
        items: [item({ title: "Terms &amp; Conditions", url: `${WP}/terms/`, menu_order: 1 })],
      }),
    ];
    const [col] = buildNavColumns(nav);
    expect(col.header).toBe("Legal & policies");
    expect(col.links[0].label).toBe("Terms & Conditions");
  });

  it("remaps legacy WP slugs to their headless routes", () => {
    expect(normaliseNavHref(`${WP}/contact/`)).toBe("/contact-us");
    expect(normaliseNavHref(`${WP}/policies/`)).toBe("/privacy-policy");
  });

  it("leaves third-party URLs untouched", () => {
    expect(normaliseNavHref("https://cpduk.co.uk/members")).toBe("https://cpduk.co.uk/members");
  });
});

describe("buildNavColumns — link targets", () => {
  it("marks third-party links external and internal links not", () => {
    const nav = [
      item({
        title: "Quick links",
        url: "#",
        menu_order: 1,
        items: [
          item({ title: "About us", url: `${WP}/about-us/`, menu_order: 1 }),
          item({ title: "CPD", url: "https://cpduk.co.uk/", menu_order: 2 }),
        ],
      }),
    ];

    const [about, cpd] = buildNavColumns(nav)[0].links;

    expect(about.external).toBe(false);
    expect(about.href).toBe("/about-us");
    expect(cpd.external).toBe(true);
  });

  it("honours an explicit _blank target on an internal link", () => {
    const nav = [
      item({
        title: "Support",
        url: "#",
        menu_order: 1,
        items: [
          item({ title: "Contact us", url: `${WP}/contact-us/`, target: "_blank", menu_order: 1 }),
        ],
      }),
    ];

    expect(buildNavColumns(nav)[0].links[0].external).toBe(true);
  });

  it("gives every link a unique key", () => {
    const cols = buildNavColumns(liveMenu());
    const keys = cols.flatMap((c) => c.links.map((l) => l.key));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

/**
 * QA-HOME-A9 (`R-HOME-1920-15`) — the three removed footer destinations.
 *
 * The E2E check cannot prove this: locally the footer endpoint returns
 * `nav: []`, so an assertion that the three links are absent passes on empty
 * data and would keep passing if the filter were deleted. The payloads below are
 * the shapes prod actually serves, captured from
 * `https://trainingexcellence.org.uk/wp-json/lms-backend/v1/footer` on
 * 2026-08-14. That is the data the filter has to survive.
 */
describe("buildNavColumns — removed destinations", () => {
  const hrefs = (cols: ReturnType<typeof buildNavColumns>) =>
    cols.flatMap((c) => c.links.map((l) => l.href));

  /** The legacy `{ about, support }` payload prod still returns. */
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

  it("drops them from the prod CMS payload", () => {
    const rendered = hrefs(buildNavColumns(PROD_NAV));

    expect(rendered).not.toContain("/careers");
    expect(rendered).not.toContain("/resources");
    expect(rendered).not.toContain("/force-for-good");
  });

  it("keeps every other CMS link, in order and remapped", () => {
    const cols = buildNavColumns(PROD_NAV);

    expect(cols[0].links.map((l) => l.href)).toEqual(["/about", "/reviews"]);
    expect(cols[1].links.map((l) => l.href)).toEqual([
      "/help",
      "/contact-us",
      "/verify-certificate",
      "/cancellations",
      "/privacy-policy",
    ]);
  });

  it("drops them from a nested WP menu served off an unrecognised origin", () => {
    // `toFrontendPath` only strips the origin it knows, so these stay absolute —
    // exactly the case a string-equality filter would miss.
    const nav = [
      item({
        title: "Quick links",
        url: "#",
        menu_order: 1,
        items: [
          item({ title: "Resources", url: "https://wp.test/resources", menu_order: 1 }),
          item({ title: "Reviews", url: "https://wp.test/reviews", menu_order: 2 }),
          item({ title: "Force for Good", url: "https://wp.test/force-for-good", menu_order: 3 }),
        ],
      }),
    ];

    expect(hrefs(buildNavColumns(nav))).toEqual(["https://wp.test/reviews"]);
  });

  it("drops them from the built-in fallback", () => {
    const rendered = hrefs(buildNavColumns(undefined));

    expect(rendered).not.toContain("/resources");
    expect(rendered).not.toContain("/force-for-good");
    expect(rendered).toContain("/about-us");
    // The list itself no longer carries them, so the filter is a belt-and-braces
    // guard here: every entry survives, split across two non-empty columns.
    const cols = buildNavColumns(undefined);
    expect(cols[1].links.length).toBeGreaterThan(1);
    expect(rendered.length).toBe(FALLBACK_NAV_LINKS.length);
  });

  it("matches the destination, not the label", () => {
    // An editor renaming a removed item must not resurrect it.
    const rendered = hrefs(
      buildNavColumns({
        about: [
          { label: "Careers", href: "/careers/" },
          { label: "Reviews", href: "/reviews" },
        ],
        support: [],
      }),
    );

    expect(rendered).toEqual(["/reviews"]);
  });
});
