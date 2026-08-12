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

/**
 * Homepage — `QA_EXECUTION.md` slice 1. Authoritative node `6013:89909`.
 *
 * Hero band: the frame's Hero Section (`6056:20231`) is 844 tall and holds two
 * columns — text `6056:20234` at y=160 h=500, visual `6056:20265` at y=133
 * h=577. The band is sized by the taller one, so the vertical inset is
 * 133 top / 134 bottom. The QA report's "80–100px" matches neither the frame nor
 * the build; per `design-token-fidelity` the measurement wins.
 */
const HOME_HERO_PAD_1920 = 133;

test.describe("Class A — Homepage", () => {
  test("hero vertical padding matches the measured band", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    test.skip(vw !== 1920, "Hero inset is only measured on the 1920 frame.");

    await page.goto("/");
    const pad = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      let sec: Element | null = h1;
      while (sec && sec.tagName !== "SECTION" && sec.parentElement) sec = sec.parentElement;
      const inner = sec?.querySelector(":scope > div") ?? null;
      if (!inner) return null;
      const s = getComputedStyle(inner);
      return { top: parseFloat(s.paddingTop), bottom: parseFloat(s.paddingBottom) };
    });

    expect(pad, "could not locate the hero content wrapper").not.toBeNull();
    const tol = 4;
    expect(
      Math.abs(pad!.top - HOME_HERO_PAD_1920),
      `hero padding-top @1920: got ${pad!.top}, design ${HOME_HERO_PAD_1920} (node 6056:20231, band 844) +/-${tol}`,
    ).toBeLessThanOrEqual(tol);
    expect(
      Math.abs(pad!.bottom - HOME_HERO_PAD_1920),
      `hero padding-bottom @1920: got ${pad!.bottom}, design ${HOME_HERO_PAD_1920} (node 6056:20231, band 844) +/-${tol}`,
    ).toBeLessThanOrEqual(tol);
  });

  /**
   * The QA report asks for the card title colour to be *stable* on hover. No
   * static Figma frame can express a hover state, so the report is the source
   * here — recorded as such rather than pretending a node was measured.
   */
  test("course card title colour is stable on hover", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    await page.goto("/");
    // `:visible` matters — the carousel keeps off-screen duplicate slides in the
    // DOM, and the first match is one of them.
    const card = page
      .locator('a[href^="/course/"]:visible')
      .filter({ has: page.locator("h3") })
      .first();
    await card.waitFor({ state: "visible", timeout: 15_000 });
    await card.scrollIntoViewIfNeeded();

    const title = card.locator("h3").first();
    const rest = await title.evaluate((el) => getComputedStyle(el).color);
    await card.hover();
    await page.waitForTimeout(250); // outlast `transition-colors`
    const hovered = await title.evaluate((el) => getComputedStyle(el).color);

    expect(
      hovered,
      `card title colour @${vw}: ${rest} at rest, ${hovered} on hover — the report asks for it to stay put`,
    ).toBe(rest);
  });

  /**
   * Weight only. Casing is deliberately not asserted: the frame itself mixes
   * cases ("Explore courses by category" `6013:89983` is sentence case,
   * "Trusted by Over 1000+ UK organisations" `6013:89966` is mixed), so there is
   * no Title Case rule in the design to assert against.
   *
   * 700 is the `Heading/Bold/H2` token. The footer is excluded: its heading is
   * `Heading/Medium/H2` (500) per node `89:3918`, and is correct as-is.
   */
  test("section headings use the bold H2 token", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    await page.goto("/");
    const weights = await page.evaluate(() =>
      [...(document.querySelector("main") ?? document.body).querySelectorAll("h2")].map((h) => ({
        text: (h.textContent || "").trim().slice(0, 48),
        weight: getComputedStyle(h).fontWeight,
      })),
    );

    expect(weights.length, "no <h2> found on the homepage").toBeGreaterThan(0);
    const wrong = weights.filter((w) => w.weight !== "700");
    expect(
      wrong,
      `@${vw} these section headings are not weight 700 (Heading/Bold/H2): ${wrong
        .map((w) => `"${w.text}"=${w.weight}`)
        .join(", ")}`,
    ).toEqual([]);
  });
});
