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
 * injected by `parseToc`) is replaced with an empty same-id anchor so Table of
 * Contents scroll-to links keep working, while its text is returned separately
 * for use as the rendered FAQ component's heading.
 */
export function parseFaq(html: string): { faq: FaqItem[]; heading?: string; content: string } {
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
  let anchor = "";
  const precedingHeadingRe = /<h[23][^>]*>([\s\S]*?)<\/h[23]>\s*$/i;
  const headingMatch = precedingHeadingRe.exec(html.slice(0, faqDivStart));
  if (headingMatch) {
    heading = stripTags(headingMatch[1]);
    replaceFrom = faqDivStart - headingMatch[0].length;
    const id = /\bid="([^"]+)"/.exec(headingMatch[0])?.[1];
    if (id) anchor = `<span id="${id}"></span>`;
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

  const content = html.slice(0, replaceFrom) + anchor + html.slice(blockOuterEnd);
  return { faq, heading, content };
}
