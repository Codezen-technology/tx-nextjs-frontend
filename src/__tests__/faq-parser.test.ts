import { describe, expect, it } from "vitest";
import { parseFaq } from "@/lib/utils/faq";
import { parseToc } from "@/lib/utils/toc";

const FAQ_BLOCK = `<div id="rank-math-faq" class="rank-math-block">
<div class="rank-math-list ">
<div id="faq-question-1" class="rank-math-list-item">
<h3 class="rank-math-question "><strong>Can I become a nursing assistant without a degree?</strong></h3>
<div class="rank-math-answer ">
<p>Yes. A university degree is not required.</p>
</div>
</div>
</div>
</div>`;

/** Shape of a real WP post: several h2 sections, then an `FAQ` h2 + Rank Math block. */
const POST = `<p class="wp-block-paragraph">Intro paragraph.</p>

<h2 class="wp-block-heading">Who can be a nursing assistant?</h2>

<p class="wp-block-paragraph">Body of the first section.</p>

<h2 class="wp-block-heading">What skills do you need?</h2>

<p class="wp-block-paragraph">Body of the second section.</p>

<h2 class="wp-block-heading">FAQ</h2>

${FAQ_BLOCK}`;

describe("parseFaq", () => {
  it("only consumes the heading immediately before the FAQ block", () => {
    const { faq, heading, content } = parseFaq(POST);

    expect(heading).toBe("FAQ");
    expect(faq).toHaveLength(1);
    // The earlier sections must survive — a greedy heading match used to swallow
    // everything from the first h2 onwards into the FAQ heading.
    expect(content).toContain("Who can be a nursing assistant?");
    expect(content).toContain("Body of the first section.");
    expect(content).toContain("What skills do you need?");
    expect(content).toContain("Body of the second section.");
    expect(content).not.toContain("rank-math-faq");
  });

  it("keeps every ToC heading id resolvable — in the content, or on the FAQ heading", () => {
    const { toc, content: withIds } = parseToc(POST);
    const { content, headingId } = parseFaq(withIds);

    expect(toc.map((t) => t.id)).toEqual([
      "who-can-be-a-nursing-assistant",
      "what-skills-do-you-need",
      "faq",
    ]);
    // The FAQ heading is extracted, so its id moves to `CourseFaq`'s own <h2>
    // rather than being parked on an empty span the observer cannot see.
    expect(headingId).toBe("faq");
    expect(content).not.toContain(`<span id="faq">`);
    for (const { id } of toc.filter((t) => t.id !== headingId)) {
      expect(content).toContain(`id="${id}"`);
    }
  });

  it("takes an h3 FAQ heading as readily as an h2", () => {
    const { heading, headingId, content } = parseFaq(`<p>x</p><h3 id="faq">FAQ</h3>${FAQ_BLOCK}`);

    expect(heading).toBe("FAQ");
    expect(headingId).toBe("faq");
    expect(content).toBe("<p>x</p>");
  });

  it("leaves the FAQ heading alone when something else sits between it and the block", () => {
    const { heading, headingId, content } = parseFaq(
      `<h2 id="faq">FAQ</h2><p>Lead-in paragraph.</p>${FAQ_BLOCK}`,
    );

    // Nothing was extracted, so the id has to stay where the ToC points.
    expect(heading).toBeUndefined();
    expect(headingId).toBeUndefined();
    expect(content).toContain(`<h2 id="faq">FAQ</h2>`);
    expect(content).toContain("Lead-in paragraph.");
    expect(content).not.toContain("rank-math-faq");
  });

  it("parses a block with no heading before it", () => {
    const { faq, heading, headingId, content } = parseFaq(`<p>x</p>${FAQ_BLOCK}`);

    expect(faq).toHaveLength(1);
    expect(heading).toBeUndefined();
    expect(headingId).toBeUndefined();
    expect(content).toBe("<p>x</p>");
  });

  it("reads the id off the opening tag, not off nested markup", () => {
    // `parseToc` puts the id on the heading itself; anything nested — an
    // editor-inserted anchor span, say — is not the ToC target.
    const { heading, headingId } = parseFaq(
      `<h2 id="faq" class="c">FAQ <span id="inner"></span></h2>${FAQ_BLOCK}`,
    );

    expect(heading).toBe("FAQ");
    expect(headingId).toBe("faq");
  });

  it("survives a `>` inside a heading attribute", () => {
    const { heading, headingId } = parseFaq(`<h2 id="faq" title="a > b">FAQ</h2>${FAQ_BLOCK}`);

    expect(heading).toBe("FAQ");
    expect(headingId).toBe("faq");
  });

  it("returns the content untouched when there is no FAQ block", () => {
    const html = `<h2 id="a">A</h2><p>x</p>`;
    expect(parseFaq(html)).toEqual({ faq: [], content: html });
  });

  it("leaves the block and its heading in place when no items parse", () => {
    const html = `<h2 id="faq">FAQ</h2><div id="rank-math-faq" class="rank-math-block"><div class="rank-math-list "></div></div>`;
    // Removing an unrecognised block would strip the heading too, orphaning the
    // ToC link that points at it.
    expect(parseFaq(html)).toEqual({ faq: [], content: html });
  });
});
