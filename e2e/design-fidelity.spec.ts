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

/**
 * Scroll the page end to end, then wait for its images to decode.
 *
 * Both halves matter. Images below the fold are lazy, so an unscrolled page
 * never requests them and a wait on `img.complete` hangs forever rather than
 * failing. And the CPD row's overflow only exists once its images have decoded —
 * before that the section reserves its declared box and measures clean, which is
 * how every earlier sweep missed `QA-HOME-A6`.
 *
 * The per-image wait is capped: a decode that never resolves (a 404 with no
 * error event, an offline CDN) must not turn an assertion into a timeout.
 */
async function settleImages(page: Page, capMs = 4000): Promise<void> {
  await page.evaluate(async (cap) => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);

    const deadline = new Promise((r) => setTimeout(r, cap));
    await Promise.race([
      Promise.all(
        [...document.querySelectorAll("img")].map((img) =>
          img.complete
            ? null
            : new Promise((r) => {
                img.addEventListener("load", r, { once: true });
                img.addEventListener("error", r, { once: true });
              }),
        ),
      ),
      deadline,
    ]);
    // One frame for the decoded intrinsic sizes to land in layout.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, capMs);
}

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

  /**
   * `QA-HOME-A6` — "the header and the body text doesn't cover the full width".
   *
   * The CPD section had no mobile direction, so at 440 its text column took 200
   * of the 392 content column. The same row let its two `w-70` (280px) images
   * outgrow their shrinking grey box, which is what pushed the page 32px wider
   * than the viewport. Both faults are measured per breakpoint in `targets.md`.
   *
   * The images must have decoded before either can be observed — the section
   * measures clean until then, which is how earlier sweeps missed the overflow.
   */
  test("the CPD section spans the content column at mobile", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    test.skip(vw !== 440, "QA-HOME-A6 is filed at 440.");

    await page.goto("/");
    await settleImages(page);
    const m = await page.evaluate(() => {
      const h2 = [...document.querySelectorAll("main h2")].find((h) =>
        /certificate|transcript/i.test(h.textContent || ""),
      );
      if (!h2) return null;
      const section = h2.closest("section");
      if (!section) return null;

      const container = h2.closest(".container");
      const cs = container && getComputedStyle(container);
      const p = section.querySelector("p");
      return {
        content:
          container && cs
            ? Math.round(
                container.getBoundingClientRect().width -
                  parseFloat(cs.paddingLeft) -
                  parseFloat(cs.paddingRight),
              )
            : null,
        heading: Math.round(h2.getBoundingClientRect().width),
        body: p ? Math.round(p.getBoundingClientRect().width) : null,
      };
    });

    expect(m, "no CPD certificate section found on the homepage").not.toBeNull();
    const { content, heading, body } = m!;
    const tol = 2;

    expect(
      Math.abs(heading - content!) <= tol,
      `homepage CPD heading width @${vw}: design ${content} (the content column) +/-${tol}, observed ${heading}`,
    ).toBe(true);
    expect(
      Math.abs(body! - content!) <= tol,
      `homepage CPD body width @${vw}: design ${content} (the content column) +/-${tol}, observed ${body}`,
    ).toBe(true);
  });

  /**
   * The other half of `QA-HOME-A6`. Page-level rather than section-level on
   * purpose: the CPD images overflowed with no `overflow-hidden` ancestor to
   * absorb them, so the symptom the report describes is the whole page
   * scrolling. Asserting the section alone would pass under an `overflow-hidden`
   * that hid the fault instead of fixing it.
   */
  test("the homepage never scrolls wider than the viewport", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;

    await page.goto("/");
    await settleImages(page);
    const m = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      // Name the offender: an element past the right edge with no clipping
      // ancestor. Without this the failure is a bare number on a 27-section page.
      const offenders: string[] = [];
      document.querySelectorAll("*").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.right <= viewportWidth + 1) return;
        for (let p = el.parentElement; p; p = p.parentElement) {
          const o = getComputedStyle(p).overflowX;
          if (o === "hidden" || o === "clip" || o === "auto" || o === "scroll") return;
        }
        offenders.push(
          `<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 60)}"> right=${Math.round(r.right)}`,
        );
      });

      return {
        viewportWidth,
        scrollWidth: document.documentElement.scrollWidth,
        offenders: offenders.slice(0, 5),
      };
    });

    expect(
      m.scrollWidth,
      `homepage document scrollWidth @${vw}: design ${m.viewportWidth} (the viewport), observed ${m.scrollWidth}. Unclipped past the right edge: ${
        m.offenders.join(" | ") || "(none found — check for a clipped-but-oversized ancestor)"
      }`,
    ).toBe(m.viewportWidth);
  });

  /**
   * `QA-HOME-A7` — "the CTA should be on the bottom of the section". The report
   * is scoped to mobile; the desktop placement beside the heading is correct and
   * is asserted here so the fix cannot quietly move it at every width.
   */
  test("the categories CTA sits below the grid at mobile", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;

    await page.goto("/");
    const m = await page.evaluate(() => {
      const cta = [...document.querySelectorAll("a")].find((a) =>
        /view all courses/i.test(a.textContent || ""),
      );
      if (!cta) return null;
      const section = cta.closest("section") ?? document.body;
      const grid = [...section.querySelectorAll("div")].find(
        (d) =>
          getComputedStyle(d).display === "grid" &&
          d.children.length >= 4 &&
          [...d.children].every((k) => k.matches('a[href^="/course-cat/"]')),
      );
      const heading = section.querySelector("h3");
      if (!grid || !heading) return null;

      const box = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
      };
      return { cta: box(cta), grid: box(grid), heading: box(heading), count: 1 };
    });

    expect(m, "no categories CTA / grid pair found on the homepage").not.toBeNull();
    const { cta, grid, heading } = m!;

    if (vw <= 767) {
      expect(
        cta.top >= grid.bottom,
        `homepage categories CTA position @${vw}: design below the grid (top >= ${grid.bottom}), observed top ${cta.top}`,
      ).toBe(true);
    } else {
      // Same row as the heading: their vertical spans overlap.
      expect(
        cta.top < heading.bottom && cta.bottom > heading.top,
        `homepage categories CTA position @${vw}: design in the heading row (${heading.top}–${heading.bottom}), observed ${cta.top}–${cta.bottom}`,
      ).toBe(true);
    }
  });
});

/**
 * Blog — `QA_EXECUTION.md` slice 2. Node `6015:127034` (either of the pair; the
 * two frames are geometrically identical, see `node-resolution.md`).
 *
 * Hero band `4900:75793` is 320 tall and holds a 150-tall text block at y=85,
 * so the inset is 85 top and 85 bottom (320 − 235). Measured as the inset rather
 * than the band height, because the band is sized by its content — the same
 * reasoning as `QA-HOME-A1`, which landed on 133 rather than the report's round
 * number. The wave pattern at the band's foot is decorative and does not set it.
 *
 * The 1280 frame measures 64, which the build does not ship either. That width
 * is signed off as "Working Fine" in the report, so it is recorded in
 * `targets.md` and deliberately left alone — this row is scoped to 1920.
 */
const BLOG_HERO_PAD_1920 = 85;

test.describe("Class A — Blog", () => {
  test("hero vertical inset matches the measured band", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    test.skip(vw !== 1920, "The blog hero inset is only measured on the 1920 frame.");

    await page.goto("/blog");
    // The padding sits on the section itself here, not on an inner wrapper as it
    // does on the homepage — the blog hero's first child is its gradient overlay.
    const pad = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      let sec: Element | null = h1;
      while (sec && sec.tagName !== "SECTION" && sec.parentElement) sec = sec.parentElement;
      if (!sec) return null;
      const s = getComputedStyle(sec);
      return { top: parseFloat(s.paddingTop), bottom: parseFloat(s.paddingBottom) };
    });

    expect(pad, "could not locate the blog hero section").not.toBeNull();
    const tol = 4;
    for (const edge of ["top", "bottom"] as const) {
      expect(
        Math.abs(pad![edge] - BLOG_HERO_PAD_1920),
        `blog hero padding-${edge} @${vw}: got ${pad![edge]}, design ${BLOG_HERO_PAD_1920} (node 4900:75793, band 320 around content ending at 235) +/-${tol}`,
      ).toBeLessThanOrEqual(tol);
    }
  });

  /**
   * Weight only, and for the same reason as the homepage: the Blog frame mixes
   * cases too. "Trending Topics" (`4900:75816`) is Title Case, while the section
   * title component the frame reuses carries "Explore courses by category" in
   * sentence case. Measured on Blog rather than inherited from `QA-HOME-A3` —
   * generalising a value across pages is what produced the About Us heading
   * contradiction in `1c92a4e`.
   *
   * Casing is also the wrong thing to assert here: several `/blog` headings are
   * CMS strings (category names, post titles). Asserting their case would test
   * WordPress content, not the design.
   */
  test("section headings use the bold H2 token", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    await page.goto("/blog");
    const weights = await page.evaluate(() =>
      [...(document.querySelector("main") ?? document.body).querySelectorAll("h2")].map((h) => ({
        text: (h.textContent || "").trim().slice(0, 48),
        weight: getComputedStyle(h).fontWeight,
      })),
    );

    expect(weights.length, "no <h2> found on /blog").toBeGreaterThan(0);
    const wrong = weights.filter((w) => w.weight !== "700");
    expect(
      wrong,
      `@${vw} these /blog headings are not weight 700 (Heading/Bold/H2): ${wrong
        .map((w) => `"${w.text}"=${w.weight}`)
        .join(", ")}`,
    ).toEqual([]);
  });
});

/**
 * Course Category — `QA_EXECUTION.md` slice 3. Node `3294:42427` (either of the
 * pair; the frames are identical).
 *
 * Hero band `3294:42433` is 480 tall around a 268-tall content block at y=106,
 * so the inset is 106 (480 − 374). The band height is content-driven — 268 + 2×106
 * — which is why the inset is the target and the height is not.
 *
 * The route is the one the QA report itself links to. A category slug has to
 * exist for the page to render; if this one is ever retired, replace it rather
 * than deleting the assertions.
 */
const CATEGORY_ROUTE = "/course-cat/animal-care-training";
const CATEGORY_HERO_INSET_1920 = 106;

test.describe("Class A — Course Category", () => {
  test("page content sits on the page grid at 1280", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    test.skip(vw !== 1280, "The 128px laptop padding is a 1280 target.");

    await page.goto(CATEGORY_ROUTE);
    const edges = await page.evaluate(() => {
      const edge = (el: Element | null) =>
        el
          ? Math.round(
              el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).paddingLeft),
            )
          : null;
      // Anchor on the page column itself. Walking up by `max-width` would not
      // find it — `container` sets `max-width: none` until the 1400 cap, so the
      // walk sails past it to the page wrapper.
      const h2 = document.querySelector("main h2");
      return {
        header: edge(document.querySelector("header .container")),
        content: edge(h2?.closest(".container") ?? null),
        hero: Math.round(document.querySelector("h1")!.getBoundingClientRect().left),
      };
    });

    // The header already reads the page grid. Anything that has to line up with
    // the content column reads the same definition — that is what `page-grid`
    // exists to guarantee, and 128 is the measured 1280 step.
    expect(
      edges.content,
      `category content edge @${vw}: got ${edges.content}, design 128 (page-grid --page-grid-pad-xl; header sits at ${edges.header})`,
    ).toBe(128);
    expect(
      edges.hero,
      `category hero content edge @${vw}: got ${edges.hero}, design 128 — the hero must share the page column, not roll its own`,
    ).toBe(128);
  });

  test("hero vertical inset matches the measured band", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    test.skip(vw !== 1920, "The category hero inset is only measured on the 1920 frame.");

    await page.goto(CATEGORY_ROUTE);
    const inset = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return null;
      // The band is the nearest ancestor that paints the hero background.
      let band: HTMLElement | null = h1.parentElement as HTMLElement | null;
      while (band && !band.className.includes("overflow-hidden") && band.parentElement) {
        band = band.parentElement as HTMLElement;
      }
      if (!band) return null;
      const s = getComputedStyle(band);
      return { top: parseFloat(s.paddingTop), bottom: parseFloat(s.paddingBottom) };
    });

    expect(inset, "could not locate the category hero band").not.toBeNull();
    const tol = 4;
    for (const edge of ["top", "bottom"] as const) {
      expect(
        Math.abs(inset![edge] - CATEGORY_HERO_INSET_1920),
        `category hero padding-${edge} @${vw}: got ${inset![edge]}, design ${CATEGORY_HERO_INSET_1920} (node 3294:42433, band 480 around content ending at 374) +/-${tol}. A fixed-height band shrinks this as the title wraps; the inset is the invariant.`,
      ).toBeLessThanOrEqual(tol);
    }
  });

  /**
   * Weight only. The Category frame mixes cases exactly as Blog and the homepage
   * do — `3294:42501` "Why Choose Us?" and `3294:42444` "Frequently Asked
   * Questions…" are Title Case, while the section-title component the frame
   * reuses carries "Explore courses by category" in sentence case. Measured here
   * rather than inherited, per the runbook's rule against generalising a value
   * across pages.
   */
  test("section headings use the bold H2 token", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    await page.goto(CATEGORY_ROUTE);
    const weights = await page.evaluate(() =>
      [...(document.querySelector("main") ?? document.body).querySelectorAll("h2")].map((h) => ({
        text: (h.textContent || "").trim().slice(0, 48),
        weight: getComputedStyle(h).fontWeight,
      })),
    );

    expect(weights.length, "no <h2> found on the category page").toBeGreaterThan(0);
    const wrong = weights.filter((w) => w.weight !== "700");
    expect(
      wrong,
      `@${vw} these category headings are not weight 700 (Heading/Bold/H2): ${wrong
        .map((w) => `"${w.text}"=${w.weight}`)
        .join(", ")}`,
    ).toEqual([]);
  });
});

/**
 * All Courses — `QA_EXECUTION.md` slice 4. Node `3306:50109` (either of the pair;
 * "v2" is a naming artefact, not a revision).
 *
 * Hero band `3306:50115` is 320 tall around a 96-tall content block at y=112, so
 * the inset is 112 (320 − 208). The build already ships exactly that, so the hero
 * assertion is a guard rather than a fix — recorded as verify-and-close.
 *
 * Four pages, four insets: 133 homepage, 85 blog, 106 category, 112 here. Sharing
 * any one of them across pages would have been wrong every time.
 */
const COURSES_HERO_INSET_1920 = 112;

test.describe("Class A — All Courses", () => {
  test("all-courses hero inset matches the measured band", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    test.skip(vw !== 1920, "The all-courses hero inset is only measured on the 1920 frame.");

    await page.goto("/all-courses");
    const pad = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      const band = h1?.parentElement;
      if (!band) return null;
      const s = getComputedStyle(band);
      return { top: parseFloat(s.paddingTop), bottom: parseFloat(s.paddingBottom) };
    });

    expect(pad, "could not locate the all-courses hero band").not.toBeNull();
    const tol = 4;
    for (const edge of ["top", "bottom"] as const) {
      expect(
        Math.abs(pad![edge] - COURSES_HERO_INSET_1920),
        `all-courses hero padding-${edge} @${vw}: got ${pad![edge]}, design ${COURSES_HERO_INSET_1920} (node 3306:50115, band 320 around content ending at 208) +/-${tol}`,
      ).toBeLessThanOrEqual(tol);
    }
  });

  /**
   * Not a filed QA row. `page-grid` already requires that no component restate
   * the grid as a literal, and this page restated it three times — hero, client
   * and loading skeleton all carried `mx-auto max-w-[1296px] px-4`, which put
   * content at 16 while the header sat at 128. The report marks All Courses
   * laptop "Working Fine", so QA missed here what it caught on Blog and Category.
   */
  test("all-courses content sits on the page grid at 1280", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    test.skip(vw !== 1280, "The 128px laptop step is a 1280 target.");

    await page.goto("/all-courses");
    const edges = await page.evaluate(() => {
      const edge = (el: Element | null) =>
        el
          ? Math.round(
              el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).paddingLeft),
            )
          : null;
      return {
        header: edge(document.querySelector("header .container")),
        hero: edge(document.querySelector("h1")?.closest(".container") ?? null),
      };
    });

    expect(
      edges.hero,
      `all-courses hero content edge @${vw}: got ${edges.hero}, design 128 (page-grid; header sits at ${edges.header}). A component that restates the grid as a literal drifts from it — see the page-grid spec.`,
    ).toBe(128);
  });

  /**
   * Weight only, measured here rather than inherited. The frame reuses the same
   * section-title component as Blog and Category, whose text is "Explore courses
   * by category" in sentence case, while this page's own headings are category
   * names straight from WordPress — asserting their case would test CMS content.
   */
  test("all-courses section headings use the bold H2 token", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    await page.goto("/all-courses");
    const weights = await page.evaluate(() =>
      [...(document.querySelector("main") ?? document.body).querySelectorAll("h2")].map((h) => ({
        text: (h.textContent || "").trim().slice(0, 48),
        weight: getComputedStyle(h).fontWeight,
      })),
    );

    expect(weights.length, "no <h2> found on /all-courses").toBeGreaterThan(0);
    const wrong = weights.filter((w) => w.weight !== "700");
    expect(
      wrong,
      `@${vw} these all-courses headings are not weight 700 (Heading/Bold/H2): ${wrong
        .map((w) => `"${w.text}"=${w.weight}`)
        .join(", ")}`,
    ).toEqual([]);
  });

  /**
   * QA-COURSES-A4 — report item R-COURSES-1920-03, "in the CTA, there are
   * courses written multiple times".
   *
   * 18 of the 20 category names WordPress serves already end in "Courses", so a
   * CTA that appends the word to the raw name says it twice. The frame
   * (3306:50171) reads "View all care certificate courses" — the word once.
   *
   * The unit test over `categoryCtaLabel` is the guard; this proves the helper
   * is wired into both CTA surfaces on the real page.
   */
  test("all-courses category CTAs say 'courses' exactly once", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    await page.goto("/all-courses");
    await page
      .locator("main a", { hasText: /^View all/i })
      .first()
      .waitFor();

    const labels = await page.evaluate(() =>
      [...(document.querySelector("main") ?? document.body).querySelectorAll("a")]
        .map((a) => (a.textContent || "").replace(/\s+/g, " ").trim())
        .filter((t) => /^view all/i.test(t)),
    );

    expect(labels.length, "no 'View all …' CTA found on /all-courses").toBeGreaterThan(0);
    const doubled = labels.filter((t) => (t.match(/\bcourses?\b/gi)?.length ?? 0) !== 1);
    expect(
      doubled,
      `@${vw} these all-courses CTAs do not say "courses" exactly once: ${doubled
        .map((t) => `"${t}"`)
        .join(", ")}`,
    ).toEqual([]);
  });
});

/**
 * Checkout + Priority Support — `QA_EXECUTION.md` slice 5. `QA-CHECK-A1` and
 * `QA-SUPPORT-A1` are the same defect in one shared component.
 *
 * Neither page has a Figma reference, so the runbook's fallback applies: measure
 * the live WP page. That was attempted and came up empty — `trainingexcellence.org.uk`
 * renders no equivalent dropdown to measure. The source of record is therefore the
 * report itself, which states a number rather than a range: **16px on the right**.
 *
 * Both dropdown implementations sit at 12 today, which is what "almost no padding"
 * describes:
 *
 *   `forms/gravity-form.tsx`  native select, `px-3` → padding-right 12
 *   `gf-fields/select-field.tsx`  `appearance-none` + chevron at `right-3` → 12
 *
 * So the target is the dropdown's right-hand inset, whatever occupies it: the
 * chevron's gap from the edge where one is drawn, the text padding otherwise.
 *
 * Asserted on `/support-request`, which renders the shared Gravity Form select
 * without a cart. `/checkout` uses the same component but redirects to `/cart`
 * when empty, and seeding a cart inside a design-fidelity spec would make it a
 * checkout test. `QA-CHECK-A1` closes on the shared component, recorded as such.
 */
const DROPDOWN_RIGHT_INSET = 16;

test.describe("Class A — dropdown right inset", () => {
  test("dropdowns keep 16px on the right", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    await page.goto("/support-request?issue=access");
    // The wizard's form arrives behind Suspense; without this the page has no
    // dropdown yet and the check passes vacuously.
    await page.locator("select").first().waitFor({ state: "attached", timeout: 15_000 });

    const found = await page.evaluate(() => {
      return [...document.querySelectorAll("select")]
        .filter((s) => s.getBoundingClientRect().width > 0)
        .map((s) => {
          const r = s.getBoundingClientRect();
          const cs = getComputedStyle(s);
          // A custom chevron owns the right inset when one is drawn; otherwise
          // the padding does.
          const icon = s.parentElement?.querySelector("svg");
          const ir = icon?.getBoundingClientRect();
          return {
            label: (s.previousElementSibling?.textContent || s.name || "select")
              .trim()
              .slice(0, 30),
            inset: ir ? Math.round(r.right - ir.right) : Math.round(parseFloat(cs.paddingRight)),
            via: ir ? "chevron" : "padding-right",
          };
        });
    });

    expect(found.length, "no visible dropdown on /support-request").toBeGreaterThan(0);
    const wrong = found.filter((f) => Math.abs(f.inset - DROPDOWN_RIGHT_INSET) > 1);
    expect(
      wrong,
      `@${vw} these dropdowns are not ${DROPDOWN_RIGHT_INSET}px in from the right (report: "add some padding (16px) on the right side of the dropdown"): ${wrong
        .map((f) => `"${f.label}" = ${f.inset} via ${f.via}`)
        .join(", ")}`,
    ).toEqual([]);
  });
});

/**
 * QA-HOME-A2 — mobile section rhythm.
 *
 * Measured on the only 440 frame that stacks top-level sections, blog mobile
 * `4115:68390`. Three independent gaps between adjacent section frames, all 40:
 *
 *   Trending band  0 → 721      next section at 761   → 40
 *   category list  761 → 9489   next section at 9529  → 40
 *   CTA block      9529 → 9790  footer at 9830        → 40
 *
 * Corroborated by the report ("mobile section spacing not 40px") and by the
 * About Us mobile frame inside `6239:102399`, whose sections carry 40 of their
 * own vertical padding. The 32 in `targets.md` is the gap between sibling card
 * blocks *inside* one section (`4115:10365` → `4115:10854`, 1460 − 1428), not
 * between sections — that ambiguity is what this test settles.
 *
 * The build stacks sections with no gap, so the design's 40 is expressed as
 * `--section-rhythm-mobile / 2` of vertical padding on each side of every
 * boundary. Rhythm is therefore measured as the total whitespace across a
 * boundary: padding-bottom(A) + the box gap + padding-top(B).
 *
 * Heroes are excluded. A hero is a band sized by its content, not a rhythm
 * participant — the frame gives it its own inset (QA-HOME-A1, 133 at 1920).
 */
const SECTION_RHYTHM_440 = 40;

/**
 * The pages the shared sections land on. `/support-request` is deliberately
 * absent: it stacks a hero and one reviews section, so every boundary it has is
 * a hero boundary and there is nothing here to measure. It still receives the
 * token through `reviews-section`.
 */
const RHYTHM_ROUTES = [
  "/", // trusted-orgs, categories+courses, reviews, pricing, why, team, cpd
  "/pricing", // shares trusted-orgs, categories, reviews, pricing-section
  "/cancellations", // shares reviews-section
];

test.describe("Class A — mobile section rhythm", () => {
  for (const route of RHYTHM_ROUTES) {
    test(`${route} stacks its sections on the measured mobile rhythm`, async ({
      page,
      viewport,
    }) => {
      const vw = viewport?.width ?? 0;
      test.skip(vw !== 440, "The section rhythm is only measured on the 440 frame.");

      await page.goto(route);
      const boundaries = await page.evaluate(() => {
        const sections = [
          ...(document.querySelector("main") ?? document.body).querySelectorAll(":scope > section"),
        ].filter((s) => s.getBoundingClientRect().height > 0);

        // A hero owns its own vertical inset and is not part of the rhythm.
        const isHero = (el: Element) => el.querySelector("h1") !== null;

        const out: { after: string; before: string; rhythm: number }[] = [];
        for (let i = 0; i + 1 < sections.length; i++) {
          const a = sections[i];
          const b = sections[i + 1];
          if (isHero(a) || isHero(b)) continue;
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          const label = (el: Element) =>
            (el.querySelector("h2")?.textContent || el.className || el.tagName)
              .trim()
              .slice(0, 40) || "(unnamed)";
          out.push({
            after: label(a),
            before: label(b),
            rhythm: Math.round(
              parseFloat(getComputedStyle(a).paddingBottom) +
                (rb.top - ra.bottom) +
                parseFloat(getComputedStyle(b).paddingTop),
            ),
          });
        }
        return out;
      });

      expect(boundaries.length, `${route}: found no section boundary to measure`).toBeGreaterThan(
        0,
      );

      const tol = 4;
      const wrong = boundaries.filter((x) => Math.abs(x.rhythm - SECTION_RHYTHM_440) > tol);
      expect(
        wrong,
        `${route} section rhythm @${vw}: design ${SECTION_RHYTHM_440} +/-${tol} (blog mobile 4115:68390). Off: ${wrong
          .map((x) => `"${x.after}" → "${x.before}" = ${x.rhythm}`)
          .join("; ")}`,
      ).toEqual([]);
    });
  }
});

/**
 * `QA-CANCEL-A2` — "the Button text label is not visible at all".
 *
 * White on `secondary-500` #9E6F21 is 4.421:1, against WCAG AA's 4.5 for normal
 * text. A 0.08 shortfall, invisible to the eye and fatal to the criterion, on a
 * token that `bg-secondary-500 text-white` puts on 39 surfaces across 35 files.
 *
 * The ratio is computed from the colours as *rendered*, never from a class name.
 * A class-name assertion would keep passing if the token behind it were later
 * redefined to something failing, which is precisely the regression this guards.
 * It also survives design taking the rejected option of moving `secondary-500`
 * itself — nothing about the requirement would change, so nothing about the test
 * should.
 *
 * Scope is *filled* controls: an interactive element painting its own
 * non-transparent, non-white background. That is the operational reading of "a
 * label on a brand-colour fill", and it is decided by computed style rather than
 * by which utility produced it.
 */
const AA_NORMAL_TEXT = 4.5;

const CONTRAST_ROUTES = [
  "/",
  "/blog",
  "/all-courses",
  "/contact-us",
  "/cancellations",
  "/support-request?issue=access",
];

interface FilledControl {
  page: string;
  text: string;
  fg: string;
  bg: string;
  ratio: number;
}

async function filledControlsFailingAA(page: Page, floor: number): Promise<FilledControl[]> {
  return page.evaluate((min) => {
    const rgb = (s: string): [number, number, number, number] | null => {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(/[,/]/).map((v) => parseFloat(v.trim()));
      return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]];
    };
    const lum = ([r, g, b]: number[]) => {
      const f = (c: number) => {
        const v = c / 255;
        return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const hex = ([r, g, b]: number[]) =>
      "#" +
      [r, g, b]
        .map((v) => Math.round(v).toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();

    const out: FilledControl[] = [];
    const controls = document.querySelectorAll(
      'button, a, [role="button"], input[type="submit"], input[type="button"]',
    );

    controls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (!(el.textContent || "").trim()) return;

      const cs = getComputedStyle(el);
      const bg = rgb(cs.backgroundColor);
      // A filled control paints its own background. An unfilled one inherits the
      // page and is out of scope — its contrast is a body-text question.
      if (!bg || bg[3] === 0) return;
      // White and near-white fills are the page surface showing through a
      // decorative wrapper, not a brand fill.
      if (bg[0] > 245 && bg[1] > 245 && bg[2] > 245) return;

      const fg = rgb(cs.color);
      if (!fg) return;

      const got = ratio(fg, bg);
      if (got >= min) return;
      out.push({
        page: location.pathname,
        text: (el.textContent || "").trim().slice(0, 40),
        fg: hex(fg),
        bg: hex(bg),
        ratio: Math.round(got * 1000) / 1000,
      });
    });
    return out;
  }, floor);
}

test.describe("Class A — interactive contrast", () => {
  for (const route of CONTRAST_ROUTES) {
    test(`${route} filled controls meet AA contrast`, async ({ page, viewport }) => {
      const vw = viewport?.width ?? 0;

      const response = await page.goto(route);
      await page.waitForLoadState("domcontentloaded");

      // A page that failed to render has no controls, and "no controls" would
      // otherwise read as "every control passes". This check was observed
      // reporting a clean pass on two routes while they were serving 500s, so
      // the render is asserted before its contents are.
      expect(
        response?.status(),
        `${route} did not render — cannot judge its contrast`,
      ).toBeLessThan(400);
      const controlCount = await page.locator("main button, main a").count();
      expect(
        controlCount,
        `${route} rendered no controls — the check would pass vacuously`,
      ).toBeGreaterThan(0);

      const failing = await filledControlsFailingAA(page, AA_NORMAL_TEXT);

      // Group by colour pair, not by element. A page with 90 cards yields 90
      // identical failures, and a 90-item list is not something anyone reads —
      // what a person needs is the pair, the ratio, and one example label.
      const byPair = new Map<string, { count: number; example: string; ratio: number }>();
      for (const f of failing) {
        const key = `${f.fg} on ${f.bg}`;
        const seen = byPair.get(key);
        if (seen) seen.count += 1;
        else byPair.set(key, { count: 1, example: f.text, ratio: f.ratio });
      }
      const summary = [...byPair.entries()]
        .map(([pair, v]) => `${pair} = ${v.ratio} (×${v.count}, e.g. "${v.example}")`)
        .join(" | ");

      expect(
        summary,
        `${route} @${vw}: filled control labels must reach WCAG AA ${AA_NORMAL_TEXT}:1. Below it: ${summary}`,
      ).toBe("");
    });
  }
});

/**
 * `QA-CONTACT-A2` — "the section colors are not according to the design".
 *
 * Reclassified `MANUAL-VISUAL` → `GAP`: frame `3277:44993` binds named tokens to
 * the page's bands, and comparing a named token to a computed fill is a
 * measurement, not the colour-matching judgement the row assumed.
 *
 * The frame is one hard edge at y=828 — white above (`neutral-0`), `#FAFBFB`
 * below (`neutral-10`) — placed exactly where the `Contact sections` frame
 * begins. Derivation and the full band table are in `.context/figma/targets.md`.
 *
 * 1920 only. The node is named "Contact US - Desktop" and has no 1280 or 440
 * sibling, so the other widths are recorded as unmeasured rather than assumed to
 * ramp from this one.
 */
const CONTACT_FILLS_1920 = [
  { heading: /get in touch with us/i, fill: "#FFFFFF", token: "neutral-0" },
  { heading: null, fill: "#FFFFFF", token: "neutral-0" }, // contact cards
  { heading: /get in touch/i, fill: "#FAFBFB", token: "neutral-10" }, // heading + form
];

const CONTACT_ICON_CIRCLE = { fill: "#E6F8FE", token: "primary-50" };

test.describe("Class A — Contact", () => {
  test("section fills match the measured frame", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    test.skip(vw !== 1920, "3277:44993 is a Desktop-only frame; 1280 and 440 are unmeasured.");

    await page.goto("/contact-us");
    // The page's content is fetched, so the sections do not exist at navigation.
    // Without this the check reports "no sections found" and reads as a broken
    // test rather than a fill mismatch.
    await page.locator("main > section").first().waitFor({ state: "attached" });
    const m = await page.evaluate(() => {
      const hex = (s: string) => {
        const p = (s.match(/rgba?\(([^)]+)\)/)?.[1] || "").split(/[,/]/).map((v) => parseFloat(v));
        if (p.length < 3 || Number.isNaN(p[0])) return null;
        return (
          "#" +
          p
            .slice(0, 3)
            .map((v) => Math.round(v).toString(16).padStart(2, "0"))
            .join("")
        ).toUpperCase();
      };
      const effective = (el: Element) => {
        for (let q: Element | null = el; q; q = q.parentElement) {
          const bg = getComputedStyle(q).backgroundColor;
          if (bg && !/rgba\([^)]*,\s*0\)/.test(bg) && bg !== "transparent") return hex(bg);
        }
        return null;
      };
      const sections = [
        ...(document.querySelector("main") ?? document.body).querySelectorAll(":scope > section"),
      ];
      const circle = document.querySelector(".rounded-full");
      return {
        sections: sections.map((s) => ({
          heading: (s.querySelector("h1,h2")?.textContent || "").trim(),
          fill: effective(s),
        })),
        circle: circle ? hex(getComputedStyle(circle).backgroundColor) : null,
      };
    });

    expect(m.sections.length, "no sections found on /contact-us").toBe(CONTACT_FILLS_1920.length);

    CONTACT_FILLS_1920.forEach((want, i) => {
      const got = m.sections[i];
      const label = want.heading ? `"${got.heading}"` : "the contact-cards section";
      expect(
        got.fill,
        `/contact-us section ${i} ${label} fill @${vw}: design ${want.fill} (${want.token}, 3277:44993), observed ${got.fill}`,
      ).toBe(want.fill);
    });

    expect(
      m.circle,
      `/contact-us card icon circle fill @${vw}: design ${CONTACT_ICON_CIRCLE.fill} (${CONTACT_ICON_CIRCLE.token}, 3277:44993), observed ${m.circle}`,
    ).toBe(CONTACT_ICON_CIRCLE.fill);
  });
});
