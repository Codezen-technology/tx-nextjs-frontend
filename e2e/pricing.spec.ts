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
