import { test, expect, type Page } from "@playwright/test";

/**
 * Design-fidelity check for the Class A items.
 *
 * Every expected value here was measured off a Figma frame and is recorded in
 * `.context/figma/targets.md` with its source node. The point is to assert the
 * number the *design* specifies — asserting that a stylesheet declaration equals
 * itself would test nothing, which is why the execution plan rejects that shape
 * of test.
 *
 * Deliberately narrow: only properties a QA item names are covered. A check that
 * asserts everything fails on every legitimate design change and gets ignored.
 */

interface Target {
  /** Content width inside the container's padding. */
  content: number;
  /** Distance from viewport edge to the content edge. */
  sidePadding: number;
  /** Blog card width. */
  card: number;
  /** Gap between cards in a row. Null where the grid is single-column. */
  gutter: number | null;
}

/**
 * Source: blog responsive section `4118:68465` — 1920 `4900:75788`,
 * 1280 `4099:78249`, 440 `4115:68390`. Cross-checked against `6013:89909`
 * and `6015:127141` at 1920.
 *
 * `tolerance` is per breakpoint. 1920 carries a wider one because the content
 * column there is capped by `max-width: 1400px`, a deliberate deviation tracked
 * separately in the `site-page-grid` change — the design's 1296 would need that
 * decision first. Recording it as tolerance rather than as the target keeps the
 * design value honest and the deviation visible.
 */
const TARGETS: Record<number, Target & { tolerance: number; note?: string }> = {
  1920: {
    content: 1296,
    sidePadding: 312,
    card: 306,
    gutter: 24,
    tolerance: 42,
    note: "container is capped at max-width:1400px — see the site-page-grid change",
  },
  1280: { content: 1024, sidePadding: 128, card: 325, gutter: 24, tolerance: 2 },
  440: { content: 392, sidePadding: 24, card: 392, gutter: null, tolerance: 2 },
};

interface Measured {
  content: number | null;
  sidePadding: number | null;
  headerContentLeft: number | null;
  card: number | null;
  gutter: number | null;
  columns: number | null;
}

async function measure(page: Page): Promise<Measured> {
  return page.evaluate(() => {
    const contentEdge = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.left + parseFloat(getComputedStyle(el).paddingLeft));
    };

    const container = document.querySelector(".container");
    const containerStyle = container && getComputedStyle(container);

    // The header's own grid alignment: its inner row is a `.container` too, so
    // its content edge must match the page's. This is the defect the check
    // exists to prevent — the two used to disagree by 128px at 1280.
    const headerInner = document.querySelector("header .container");

    // First grid whose every child holds a blog link — i.e. a blog card grid,
    // not the trending carousel (which is a two-column grid of one card).
    const grid = [...document.querySelectorAll("div")].find(
      (d) =>
        getComputedStyle(d).display === "grid" &&
        d.children.length >= 2 &&
        [...d.children].every((k) => k.querySelector('a[href^="/blog/"]')),
    );

    const cards = grid ? [...grid.children].map((c) => c.getBoundingClientRect()) : [];
    // Cards on the same visual row share a top edge; count them for the column
    // count, and take the gap between the first two only if they are adjacent.
    const firstRow = cards.filter((c) => Math.abs(c.top - cards[0]?.top) < 2);

    return {
      content:
        container && containerStyle
          ? Math.round(
              container.getBoundingClientRect().width -
                parseFloat(containerStyle.paddingLeft) -
                parseFloat(containerStyle.paddingRight),
            )
          : null,
      sidePadding: contentEdge(container),
      headerContentLeft: contentEdge(headerInner),
      card: cards[0] ? Math.round(cards[0].width) : null,
      gutter: firstRow.length > 1 ? Math.round(firstRow[1].left - firstRow[0].right) : null,
      columns: firstRow.length || null,
    };
  });
}

test.describe("Class A — the build matches the measured design", () => {
  test("blog grid geometry matches its Figma targets", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    const t = TARGETS[vw];
    if (!t) test.skip(true, `No recorded targets for ${vw}px.`);

    await page.goto("/blog");
    const m = await measure(page);
    if (m.card === null) test.skip(true, "No blog card grid on the page.");

    const near = (got: number | null, want: number, label: string) => {
      expect(
        got,
        `${label} @${vw}: measured ${got}, design ${want}${t.note ? ` (${t.note})` : ""}`,
      ).not.toBeNull();
      expect(
        Math.abs((got as number) - want),
        `${label} @${vw}: got ${got}, want ${want} +/-${t.tolerance}`,
      ).toBeLessThanOrEqual(t.tolerance);
    };

    near(m.content, t.content, "content width");
    near(m.sidePadding, t.sidePadding, "side padding");
    near(m.card, t.card, "card width");
    if (t.gutter !== null) near(m.gutter, t.gutter, "card gutter");
  });

  test("the header shares the page grid", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    await page.goto("/blog");
    const m = await measure(page);

    expect(m.headerContentLeft, "header has no .container inner row").not.toBeNull();
    // Exact, not toleranced: both read the same definition, so any difference at
    // all means one of them stopped doing so.
    expect(
      m.headerContentLeft,
      `header content edge ${m.headerContentLeft} != page content edge ${m.sidePadding} @${vw}`,
    ).toBe(m.sidePadding);
  });
});
