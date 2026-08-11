import { test, expect, type Page } from "@playwright/test";

/**
 * The `page-grid` capability check.
 *
 * The defect this exists to prevent is *divergence*: five files each carried
 * their own copy of the content width, and three of them had quietly stopped
 * agreeing. So this asserts two different things, and both matter:
 *
 *  1. The page column matches its recorded target for the breakpoint.
 *  2. Every other full-width surface matches *the page column*, exactly.
 *
 * (2) is the load-bearing half. Asserting each surface against a constant would
 * pass even if the surfaces disagreed with each other by construction — see
 * design D4 in the `site-page-grid` change.
 */

interface Target {
  /** Content width inside the container's padding. */
  content: number;
  /** Distance from the viewport edge to the content edge. */
  sidePadding: number;
  /** Permitted deviation, in px, on both of the above. */
  tolerance: number;
  /**
   * Where the number comes from. Required by the `page-grid` spec: a recorded
   * target cites a design node, or a written decision where it deliberately
   * differs from the design.
   */
  source: string;
}

/**
 * Recorded targets — task 2.1.
 *
 * 1280 and 440 are the design's own numbers, measured off the blog responsive
 * frames and applied by `0c9b097`. 1920 is *not*: the design measures a 1296
 * content column with 312 side padding, and the build renders 1336 / 292
 * because `--page-grid-max` is 1400.
 *
 * That 1400 is the status quo pending a decision, not a design ruling — nobody
 * chose it; it arrived in a scaffolding commit. It is recorded here as the
 * status quo, deliberately, so the check is green before anything moves and the
 * gap stays visible rather than being absorbed into a tolerance. When the
 * decision lands (`site-page-grid` §3), this row changes and cites it.
 */
const TARGETS: Record<number, Target> = {
  1920: {
    content: 1336,
    sidePadding: 292,
    tolerance: 1,
    source:
      "STATUS QUO, not the design — design is 1296/312 (`4900:75788`, `6013:89909`). " +
      "Pending the width decision in the site-page-grid change; delta is 40px of " +
      "content and 20px of padding.",
  },
  1280: {
    content: 1024,
    sidePadding: 128,
    tolerance: 1,
    source: "design — blog responsive laptop frame `4099:78249`",
  },
  440: {
    content: 392,
    sidePadding: 24,
    tolerance: 1,
    source: "design — blog responsive mobile frame `4115:68390`",
  },
};

/** Left content edge and content-box width of one surface. */
interface Edges {
  left: number;
  width: number;
}

type Surfaces = Record<string, Edges | null>;

/**
 * Reads the content edges of every grid consumer present on the page.
 *
 * "Content edge" is deliberately the *inside* of the padding, not the box edge:
 * the surfaces have different padding by design (the bleed has none on the
 * right), and it is where their contents line up that has to agree.
 */
async function measureSurfaces(page: Page): Promise<Surfaces> {
  return page.evaluate(() => {
    const edges = (el: Element | null): { left: number; width: number } | null => {
      if (!el) return null;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const pl = parseFloat(s.paddingLeft);
      return {
        left: Math.round(r.left + pl),
        width: Math.round(r.width - pl - parseFloat(s.paddingRight)),
      };
    };

    // The page's own column. `main` first so a page whose header renders before
    // its content still measures the content, not the header.
    const pageColumn =
      document.querySelector("main .container") ?? document.querySelector(".container");

    return {
      // Both the full header and the minimal one are `header > .container`; the
      // two never render together, so which page the test is on decides which
      // it measured.
      page: edges(pageColumn),
      header: edges(document.querySelector("header .container")),
      trustedOrgs: edges(document.querySelector('[data-grid-surface="trusted-orgs"]')),
      megaMenu: edges(document.querySelector("#mega-menu .container")),
    };
  });
}

/**
 * Opens the mega menu, which is only mounted while its trigger is hovered.
 *
 * Returns false only when the trigger is genuinely absent — the mobile nav
 * replaces it below `md`. If the trigger is there, the menu opening is not
 * optional: a swallowed timeout here would turn a real failure into a skip and
 * silently drop this breakpoint's coverage.
 */
async function openMegaMenu(page: Page): Promise<boolean> {
  const trigger = page.locator('header [aria-controls="mega-menu"]').first();
  if ((await trigger.count()) === 0) return false;
  if (!(await trigger.isVisible())) return false;

  // Hover intent debounces, and clicking toggles — hover, and click only if the
  // hover did not land within the debounce window.
  await trigger.hover();
  const panel = page.locator("#mega-menu .container").first();
  try {
    await panel.waitFor({ state: "visible", timeout: 3000 });
  } catch {
    await trigger.click();
    await panel.waitFor({ state: "visible", timeout: 5000 });
  }
  return true;
}

test.describe("page grid", () => {
  test("the page column matches its recorded target", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    const t = TARGETS[vw];
    test.skip(!t, `No recorded grid target for ${vw}px.`);

    await page.goto("/");
    const s = await measureSurfaces(page);

    expect(s.page, `page @${vw}: no .container to measure`).not.toBeNull();
    const got = s.page as Edges;

    // Task 2.6 — a failure has to say which surface, which breakpoint, what was
    // expected, what was seen, and by how much, or it costs a debugging session.
    expect(
      Math.abs(got.width - t.content),
      `page content width @${vw}: expected ${t.content}, observed ${got.width}, ` +
        `delta ${got.width - t.content} (tolerance ${t.tolerance}). Target source: ${t.source}`,
    ).toBeLessThanOrEqual(t.tolerance);

    expect(
      Math.abs(got.left - t.sidePadding),
      `page side padding @${vw}: expected ${t.sidePadding}, observed ${got.left}, ` +
        `delta ${got.left - t.sidePadding} (tolerance ${t.tolerance}). Target source: ${t.source}`,
    ).toBeLessThanOrEqual(t.tolerance);
  });

  /**
   * Tasks 2.3 / 2.4 / 2.5. Exact, not toleranced: every surface here derives
   * from `--page-grid-max` through the same two utilities, so any difference at
   * all means one of them stopped doing so. A tolerance would let exactly the
   * failure this check exists for slip through.
   */
  const agrees = (
    surface: string,
    got: Edges | null,
    want: Edges,
    vw: number,
    { width = true }: { width?: boolean } = {},
  ) => {
    expect(got, `${surface} @${vw}: not found on the page`).not.toBeNull();
    const g = got as Edges;
    expect(
      g.left,
      `${surface} left edge @${vw}: expected ${want.left} (the page column), ` +
        `observed ${g.left}, delta ${g.left - want.left}`,
    ).toBe(want.left);
    if (width) {
      expect(
        g.width,
        `${surface} content width @${vw}: expected ${want.width} (the page column), ` +
          `observed ${g.width}, delta ${g.width - want.width}`,
      ).toBe(want.width);
    }
  };

  test("the header agrees with the page column", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    await page.goto("/");
    const s = await measureSurfaces(page);
    expect(s.page, `page @${vw}: no .container to measure`).not.toBeNull();
    agrees("header", s.header, s.page as Edges, vw);
  });

  test("the minimal header agrees with the page column", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    // The minimal header is the auth-route shell; measure it on its own page and
    // compare against the same recorded target, since those routes render no
    // page-level container of their own.
    await page.goto("/login");
    const s = await measureSurfaces(page);
    const t = TARGETS[vw];
    test.skip(!t, `No recorded grid target for ${vw}px.`);

    expect(s.header, `minimal header @${vw}: no .container inner row`).not.toBeNull();
    const got = s.header as Edges;
    expect(
      Math.abs(got.left - t.sidePadding),
      `minimal header left edge @${vw}: expected ${t.sidePadding}, observed ${got.left}, ` +
        `delta ${got.left - t.sidePadding} (tolerance ${t.tolerance})`,
    ).toBeLessThanOrEqual(t.tolerance);
  });

  test("the mega menu agrees with the page column", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    await page.goto("/");
    const s = await measureSurfaces(page);
    expect(s.page, `page @${vw}: no .container to measure`).not.toBeNull();

    const opened = await openMegaMenu(page);
    test.skip(!opened, `Mega menu has no hoverable trigger at ${vw}px (mobile nav).`);

    const after = await measureSurfaces(page);
    agrees("mega menu", after.megaMenu, s.page as Edges, vw);
  });

  test("the trusted-orgs bleed starts on the page column", async ({ page, viewport }) => {
    const vw = viewport?.width ?? 0;
    await page.goto("/");
    const s = await measureSurfaces(page);
    expect(s.page, `page @${vw}: no .container to measure`).not.toBeNull();
    test.skip(s.trustedOrgs === null, "Trusted-orgs section not rendered (no sponsor data).");

    // Width is not compared: the section bleeds off the right edge on purpose.
    // Its start edge is the only one that has to agree, and it is the one that
    // was silently wrong at every width before this change.
    agrees("trusted-orgs bleed", s.trustedOrgs, s.page as Edges, vw, { width: false });
  });
});
