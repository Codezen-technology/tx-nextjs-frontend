export interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-|-$/g, "");
}

/**
 * Parses h2 headings only from WP HTML content (matching live site ToC behaviour).
 * Injects stable ID attributes so ToC anchor links work.
 * Returns the modified HTML and the ordered list of heading items.
 */
export function parseToc(html: string): { toc: TocItem[]; content: string } {
  const toc: TocItem[] = [];
  const usedIds = new Set<string>();

  const content = html.replace(
    /<(h2)([^>]*)>([\s\S]*?)<\/h2>/gi,
    (_match, tag: string, attrs: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, "").trim();
      if (!text) return _match;

      const existingId = /\bid="([^"]+)"/.exec(attrs)?.[1];
      const id = existingId ?? slugify(text);
      if (!id) return _match;

      let uniqueId = id;
      let counter = 2;
      while (usedIds.has(uniqueId)) uniqueId = `${id}-${counter++}`;
      usedIds.add(uniqueId);

      toc.push({ id: uniqueId, text, level: 2 });

      const attrsWithId = existingId ? attrs : attrs + ` id="${uniqueId}"`;
      return `<${tag}${attrsWithId}>${inner}</${tag}>`;
    },
  );

  return { toc, content };
}
