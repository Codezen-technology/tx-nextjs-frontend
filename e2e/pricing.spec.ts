import { test, expect } from "@playwright/test";

/**
 * QA-PRICE-* — pricing page rows.
 *
 * Targets in `.context/figma/targets.md` under "Pricing page", measured from
 * `6239:135726` — a section holding Desktop, Laptop and Mobile frames, so the
 * 440 rows have real targets rather than a live-site fallback.
 */
test.describe("QA-PRICE-* — pricing page", () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.goto("/pricing");
  });

  test("QA-PRICE-A1: the hero insets its content by the measured 112px", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "mobile-440", "The 112 inset is the desktop value");

    const inset = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      const band = h1?.closest("section");
      if (!band || !h1) return null;
      const br = band.getBoundingClientRect();
      // The band's own children are the decorative overlay (absolute, inset-0)
      // and the padded container — both span the full band, so measuring them
      // reports an inset of 0 whatever the padding is. Measure to the copy.
      const copy = [...band.querySelectorAll("h1, p")].filter(
        (e) => e.getBoundingClientRect().height > 0,
      );
      if (!copy.length) return null;
      const top = Math.min(...copy.map((e) => e.getBoundingClientRect().top));
      const bottom = Math.max(...copy.map((e) => e.getBoundingClientRect().bottom));
      return { top: Math.round(top - br.top), bottom: Math.round(br.bottom - bottom) };
    });

    expect(inset, "pricing: expected a hero band with content").toBeTruthy();
    // The band is content-sized, so the inset is the target and the height is not.
    expect(
      inset!.top,
      `pricing hero @${testInfo.project.name}: top inset — expected 112 (frame 6239:135726, band 320 with the title at y=112), observed ${inset!.top}`,
    ).toBeCloseTo(112, -0.5);
    expect(
      inset!.bottom,
      `pricing hero @${testInfo.project.name}: bottom inset — expected 112, observed ${inset!.bottom}`,
    ).toBeCloseTo(112, -0.5);
  });

  test("QA-PRICE-A5: every section starts on the page column", async ({ page }, testInfo) => {
    const xs = await page.evaluate(() => {
      const byText = (re: RegExp) =>
        [...document.querySelectorAll("h2, h3")].find((h) => re.test(h.textContent ?? ""));
      const categories = byText(/explore courses by category/i);
      // Not the FAQ: it sits in a `max-w-4xl` centred wrapper, so its x is the
      // centring, not the page column. Accreditations is a plain container section.
      const reference = byText(/accreditations/i);
      const round = (el?: Element) => (el ? Math.round(el.getBoundingClientRect().left) : null);
      return { categories: round(categories), reference: round(reference) };
    });

    expect(xs.categories, "pricing: expected a categories heading").not.toBeNull();
    expect(xs.reference, "pricing: expected an accreditations heading").not.toBeNull();
    expect(
      xs.categories,
      `pricing @${testInfo.project.name}: categories heading x — expected the page column (${xs.reference}, where the other plain sections start), observed ${xs.categories}. A section wrapped in a second \`container\` is inset twice`,
    ).toBe(xs.reference);
  });

  test("QA-PRICE-A2: no section heading is larger than its peers", async ({ page }, testInfo) => {
    // The row is filed at 1920. At 440 the reviews heading measures 30 against
    // the others' 32 — real, but a different width and no report item; recorded
    // in targets.md rather than asserted here.
    test.skip(testInfo.project.name === "mobile-440", "Row is scoped to 1920");
    const sizes = await page.evaluate(() =>
      [...document.querySelectorAll("h2, h3")]
        .filter((h) => (h as HTMLElement).offsetParent)
        .map((h) => ({
          text: (h.textContent ?? "").trim().slice(0, 40),
          size: parseFloat(getComputedStyle(h).fontSize),
        })),
    );

    const sectionHeadings = sizes.filter((s) => s.size >= 24);
    const distinct = [...new Set(sectionHeadings.map((s) => s.size))];
    expect(
      distinct,
      `pricing @${testInfo.project.name}: section heading sizes — expected one value, observed ${JSON.stringify(sectionHeadings)}`,
    ).toHaveLength(1);
  });

  test("QA-PRICE-A4: 40px between sections at 440", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-440", "The 40 rhythm is the 440 value");

    const gaps = await page.evaluate(() => {
      const secs = [...document.querySelectorAll("section")]
        .filter((s) => s.getBoundingClientRect().height > 120)
        // The hero band carries its own inset (QA-PRICE-A1) and is deliberately
        // not part of the section rhythm — see the note in globals.css.
        .filter((s) => !s.querySelector("h1"));
      const out: number[] = [];
      for (let i = 1; i < secs.length; i++) {
        const prev = secs[i - 1].getBoundingClientRect();
        const cur = secs[i].getBoundingClientRect();
        const prevPad = parseFloat(getComputedStyle(secs[i - 1]).paddingBottom);
        const curPad = parseFloat(getComputedStyle(secs[i]).paddingTop);
        // Sections stack flush, so the visual boundary is the two paddings.
        if (Math.round(cur.top - prev.bottom) === 0) out.push(prevPad + curPad);
      }
      return out;
    });

    expect(gaps.length, "pricing @440: expected stacked sections to measure").toBeGreaterThan(0);
    for (const gap of gaps) {
      expect(
        gap,
        `pricing @440: section boundary — expected 40 (frame mobile gaps, 6239:135726), observed ${gap}`,
      ).toBe(40);
    }
  });
});

/**
 * The pricing section is mounted on both `/` and `/pricing` from one payload, so the two
 * cannot drift. Before this, two editor-managed field groups fed it and only the homepage's
 * was maintained: `/pricing` quoted a retired price and returned `product: null`, which left
 * its CTAs navigating instead of adding to the cart — on the very page the homepage's
 * "View more details" link leads to.
 *
 * Spec: `pricing-page-layout` — "The pricing section is identical on the homepage and the
 * pricing page". The scrape covers every field that requirement enumerates; anything left
 * out is a drift vector the parity assertion would wave through.
 *
 * Selectors are `data-testid` / `data-plan-*` throughout. An earlier draft matched Tailwind
 * utilities (`grid-cols`, `font-suse`, `line-through`), which bound the assertion to styling
 * — swapping the grid for flex would have broken it with no behaviour change.
 */
/**
 * One walk over the section, shared by every row below — Playwright serialises this into
 * the page, so it has to be self-contained rather than call a module-level helper.
 */
const scrapeSection = () => {
  const section = [...document.querySelectorAll("section")].find((s) =>
    /enjoy unlimited training/i.test(s.querySelector("h2")?.textContent ?? ""),
  );
  if (!section) return null;

  const text = (el: Element | null | undefined) =>
    (el?.textContent ?? "").replace(/\s+/g, " ").trim();
  const textOrNull = (el: Element | null | undefined) => (el ? text(el) : null);

  const headerLink = section.querySelector("a[href='/pricing'], a[href$='/pricing']");

  return {
    heading: text(section.querySelector("h2")),
    description: text(section.querySelector("h2")?.parentElement?.querySelector("p")),
    headerCta: textOrNull(headerLink),
    plans: [...section.querySelectorAll("[data-testid='plan-card']")].map((card) => ({
      name: text(card.querySelector("[data-testid='plan-name']")),
      subtitle: textOrNull(card.querySelector("[data-testid='plan-subtitle']")),
      badge: card.getAttribute("data-plan-badge"),
      variant: card.getAttribute("data-plan-variant"),
      price: text(card.querySelector("[data-testid='plan-price']")),
      priceUnit: textOrNull(card.querySelector("[data-testid='plan-price-unit']")),
      originalPrice: textOrNull(card.querySelector("[data-testid='plan-original-price']")),
      cta: text(card.querySelector("[data-testid='plan-cta']")),
      // The spec calls this the load-bearing clause: a plan buyable on one page and merely
      // navigational on the other quotes a price the reader cannot act on.
      purchasable: card
        .querySelector("[data-testid='plan-cta']")
        ?.getAttribute("data-plan-purchasable"),
      features: [...card.querySelectorAll("ul li")].map((li) => ({
        label: text(li.querySelector("span")),
        // Both variants ship their own icon pair, but the filenames agree on tick/close.
        included: (li.querySelector("img")?.getAttribute("src") ?? "").includes("tick"),
      })),
    })),
  };
};

test.describe("QA-PRICE-* — pricing section parity with the homepage", () => {
  test("QA-PRICE-B1: both pages render the same pricing section", async ({ page }, testInfo) => {
    test.slow();

    await page.goto("/");
    const home = await page.evaluate(scrapeSection);
    await page.goto("/pricing");
    const pricing = await page.evaluate(scrapeSection);

    expect(home, "homepage: expected a pricing section").not.toBeNull();
    expect(pricing, "pricing: expected a pricing section").not.toBeNull();
    // Without this the comparison passes vacuously if the payload ever comes back empty.
    expect(home!.plans.length, "homepage: expected at least one plan to compare").toBeGreaterThan(
      0,
    );

    // `headerCta` is the one field that is *meant* to differ — QA-PRICE-B2 owns it.
    const { headerCta: _homeCta, ...homeSection } = home!;
    const { headerCta: _pricingCta, ...pricingSection } = pricing!;

    expect(
      pricingSection,
      `pricing @${testInfo.project.name}: /pricing must render the same section as the homepage — same heading and description, and the same plans in the same order with the same names, subtitles, prices, price units, was-prices, badges, variants, CTA labels, purchasability and features. Observed:\n  /        ${JSON.stringify(homeSection)}\n  /pricing ${JSON.stringify(pricingSection)}`,
    ).toEqual(homeSection);
  });

  test("QA-PRICE-B2: the header link is on the homepage only", async ({ page }, testInfo) => {
    await page.goto("/");
    expect(
      (await page.evaluate(scrapeSection))?.headerCta,
      `homepage @${testInfo.project.name}: expected the pricing section to keep its "View more details" link to /pricing`,
    ).toMatch(/view more details/i);

    await page.goto("/pricing");
    expect(
      (await page.evaluate(scrapeSection))?.headerCta,
      `pricing @${testInfo.project.name}: the header link targets /pricing, so on /pricing it points at the page the reader is already on — expected no link`,
    ).toBeNull();
  });

  /**
   * The spec's purchasability scenario, end to end. QA-PRICE-B1 compares the
   * `data-plan-purchasable` flag across the pages, but a flag both pages agree on could
   * still be wrong on both — this pins that the CTA on `/pricing` really reaches the cart.
   * It is the behaviour that did not exist before: those plans carried `product: null`, so
   * the button navigated to `/register` instead.
   */
  test("QA-PRICE-B3: a plan CTA on /pricing adds to the cart", async ({ page }, testInfo) => {
    test.slow();

    const cartCalls: string[] = [];
    page.on("request", (r) => {
      if (/\/api\/cart/.test(r.url())) cartCalls.push(`${r.method()} ${new URL(r.url()).pathname}`);
    });

    await page.goto("/pricing");
    const cta = page
      .locator("[data-testid='plan-card']")
      .filter({ has: page.locator("[data-plan-purchasable='true']") })
      .first()
      .locator("[data-testid='plan-cta']");

    expect(
      await cta.count(),
      `pricing @${testInfo.project.name}: expected at least one purchasable plan on /pricing — with none, the page quotes prices the reader cannot buy`,
    ).toBeGreaterThan(0);

    await cta.click();

    await page.waitForURL(/\/checkout/, { timeout: 30000 });
    expect(
      cartCalls.length,
      `pricing @${testInfo.project.name}: expected the CTA to reach the cart API, saw ${JSON.stringify(cartCalls)}`,
    ).toBeGreaterThan(0);
  });
});
