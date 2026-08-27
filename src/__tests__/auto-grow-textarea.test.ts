import { describe, it, expect } from "vitest";
import { growToFit, TEXTAREA_MAX_HEIGHT_PX } from "@/lib/utils/auto-grow-textarea";

/**
 * QA-SUPPORT-A2. The e2e covers only the growth scenario; the spec has three:
 * content shorter than the initial height, content longer, and content past the
 * cap. These are the other two.
 *
 * `scrollHeight` is 0 in jsdom, so it is defined per-element to stand for the
 * content's laid-out height.
 */
function textareaWithScrollHeight(px: number): HTMLTextAreaElement {
  const el = document.createElement("textarea");
  Object.defineProperty(el, "scrollHeight", { value: px, configurable: true });
  return el;
}

describe("growToFit", () => {
  it("grows to fit content taller than the field", () => {
    const el = textareaWithScrollHeight(180);
    growToFit(el);
    expect(el.style.height).toBe("180px");
    expect(el.style.overflowY).toBe("hidden");
  });

  it("stops at the cap and scrolls instead", () => {
    const el = textareaWithScrollHeight(TEXTAREA_MAX_HEIGHT_PX + 400);
    growToFit(el);
    expect(el.style.height).toBe(`${TEXTAREA_MAX_HEIGHT_PX}px`);
    // Past the cap the content has to remain reachable.
    expect(el.style.overflowY).toBe("auto");
  });

  it("shrinks back when content is removed", () => {
    const el = textareaWithScrollHeight(300);
    growToFit(el);
    expect(el.style.height).toBe("300px");

    Object.defineProperty(el, "scrollHeight", { value: 60, configurable: true });
    growToFit(el);
    // Without the reset to `auto` first, `scrollHeight` never reports less than
    // the current height and the field would stay at 300.
    expect(el.style.height).toBe("60px");
  });
});
