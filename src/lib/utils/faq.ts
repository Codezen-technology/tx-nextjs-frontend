export interface FaqItem {
  question: string;
  answer: string;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Given the index right after a `<div ...>` opening tag, finds the matching
 * closing tag. Returns the inner content's end index (start of `</div>`) and
 * the index right after that closing tag (for splicing the whole element out).
 */
function findBalancedDiv(html: string, openTagEnd: number): { innerEnd: number; outerEnd: number } {
  let depth = 1;
  const tagRe = /<(\/?)div\b[^>]*>/gi;
  tagRe.lastIndex = openTagEnd;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html))) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) return { innerEnd: match.index, outerEnd: tagRe.lastIndex };
  }
  return { innerEnd: html.length, outerEnd: html.length };
}

/**
 * Extracts a Rank Math FAQ block (`#rank-math-faq`) from WP post HTML, if present.
 *
 * The heading that precedes the block (e.g. `<h2 id="faq">FAQ</h2>`, with the id
 * injected by `parseToc`) is removed along with the block; its text and its id
 * come back as `heading` / `headingId` so the caller can re-render them on the
 * FAQ component's own `<h2>`. That heading then *is* the Table-of-Contents
 * target: an id parked on an empty `<span>` instead is zero-height, so it gets
 * none of `prose-wp`'s `scroll-mt` and is effectively invisible to the
 * IntersectionObserver that drives the ToC's active row.
 */
export function parseFaq(html: string): {
  faq: FaqItem[];
  heading?: string;
  headingId?: string;
  content: string;
} {
  const startMatch = /<div[^>]*id="rank-math-faq"[^>]*>/i.exec(html);
  if (!startMatch) return { faq: [], content: html };

  const faqDivStart = startMatch.index;
  const { innerEnd: blockInnerEnd, outerEnd: blockOuterEnd } = findBalancedDiv(
    html,
    faqDivStart + startMatch[0].length,
  );
  const block = html.slice(faqDivStart + startMatch[0].length, blockInnerEnd);

  let replaceFrom = faqDivStart;
  let heading: string | undefined;
  let headingId: string | undefined;
  // Anchored at the end of everything before the block, so it can only match the
  // heading that immediately precedes it. The inner lookahead is what keeps it
  // there: a plain `([\s\S]*?)` still starts at the FIRST h2 in the post and
  // spans every later heading to reach the `$`, which collapsed the whole
  // article into one FAQ heading (QA-BLOGS-A9).
  //
  // The attribute list is quote-aware rather than `[^>]*`: a `>` inside an
  // attribute value (`<h2 title="a > b">`) ended the opening tag early and put
  // the tail of that value into the heading text. Capturing the attributes
  // separately also keeps the id lookup off the heading's *content* — scanning
  // the whole match returned the id of any nested element, e.g. `FAQ <span
  // id="inner">`, which is the wrong ToC target.
  const precedingHeadingRe =
    /<h([23])((?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?)>((?:(?!<\/h[23]\s*>)[\s\S])*)<\/h\1\s*>\s*$/i;
  const headingMatch = precedingHeadingRe.exec(html.slice(0, faqDivStart));
  if (headingMatch) {
    heading = stripTags(headingMatch[3]);
    replaceFrom = faqDivStart - headingMatch[0].length;
    headingId = /\bid=["']([^"']+)["']/.exec(headingMatch[2])?.[1];
  }

  const faq: FaqItem[] = [];
  const itemRe = /<div[^>]*class="[^"]*\brank-math-list-item\b[^"]*"[^>]*>/gi;
  let itemMatch: RegExpExecArray | null;
  while ((itemMatch = itemRe.exec(block))) {
    const itemOpenEnd = itemMatch.index + itemMatch[0].length;
    const { innerEnd: itemInnerEnd, outerEnd: itemOuterEnd } = findBalancedDiv(block, itemOpenEnd);
    const item = block.slice(itemOpenEnd, itemInnerEnd);
    itemRe.lastIndex = itemOuterEnd;

    const qMatch = /<h3[^>]*class="[^"]*\brank-math-question\b[^"]*"[^>]*>([\s\S]*?)<\/h3>/i.exec(
      item,
    );
    const aOpenMatch = /<div[^>]*class="[^"]*\brank-math-answer\b[^"]*"[^>]*>/i.exec(item);
    let answer = "";
    if (aOpenMatch) {
      const { innerEnd: aInnerEnd } = findBalancedDiv(
        item,
        aOpenMatch.index + aOpenMatch[0].length,
      );
      answer = item.slice(aOpenMatch.index + aOpenMatch[0].length, aInnerEnd).trim();
    }
    const question = qMatch ? stripTags(qMatch[1]) : "";
    if (question && answer) faq.push({ question, answer });
  }

  // Nothing was recognised inside the block, so there is no FAQ component to
  // render in its place. Cutting it out anyway would delete the heading and
  // leave the Table of Contents pointing at an id that is no longer in the DOM.
  if (!faq.length) return { faq: [], content: html };

  const content = html.slice(0, replaceFrom) + html.slice(blockOuterEnd);
  return { faq, heading, headingId, content };
}
