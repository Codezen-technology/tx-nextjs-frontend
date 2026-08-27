/**
 * The tallest a free-text field may grow before it scrolls instead, so a long
 * answer cannot push the rest of a form off the screen.
 */
export const TEXTAREA_MAX_HEIGHT_PX = 320;

/**
 * Grow a textarea to fit its content, bounded — `QA-SUPPORT-A2`.
 *
 * The report asks for a box that "will cover all the text in it" and names no
 * height, so the field follows its content rather than taking a taller fixed
 * guess that is still wrong for some answer.
 *
 * One definition, two call sites: the Gravity Forms renderer used by
 * `/support-request` and `/cancellations`, and the `gf-fields` kit used by the
 * certificate form. A second copy would drift the moment the cap changed.
 */
export function growToFit(el: HTMLTextAreaElement, maxPx = TEXTAREA_MAX_HEIGHT_PX): void {
  // Reset first: `scrollHeight` never reports less than the current height, so
  // without this the field grows and never shrinks back.
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, maxPx)}px`;
  el.style.overflowY = el.scrollHeight > maxPx ? "auto" : "hidden";
}
