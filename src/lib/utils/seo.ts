export interface ParsedSeo {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogType?: string;
  ogLocale?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  jsonLd: Record<string, unknown>[];
}

function extractMeta(html: string, attr: string): string | undefined {
  const a = new RegExp(`<meta[^>]+(?:name|property)="${attr}"[^>]+content="([^"]*)"`, "i");
  const b = new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:name|property)="${attr}"`, "i");
  return html.match(a)?.[1] ?? html.match(b)?.[1];
}

function extractLink(html: string, rel: string): string | undefined {
  return (
    html.match(new RegExp(`<link[^>]+rel="${rel}"[^>]+href="([^"]*)"`, "i"))?.[1] ??
    html.match(new RegExp(`<link[^>]+href="([^"]*)"[^>]+rel="${rel}"`, "i"))?.[1]
  );
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const re = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      out.push(JSON.parse(m[1]) as Record<string, unknown>);
    } catch {
      // malformed block — skip
    }
  }
  return out;
}

/** Parse the Rank Math `head` HTML string returned by `/wp-json/rankmath/v1/getHead`. */
export function parseRankMathHead(html: string): ParsedSeo {
  return {
    title: html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim(),
    description: extractMeta(html, "description"),
    canonical: extractLink(html, "canonical"),
    robots: extractMeta(html, "robots"),
    ogType: extractMeta(html, "og:type"),
    ogLocale: extractMeta(html, "og:locale"),
    ogTitle: extractMeta(html, "og:title"),
    ogDescription: extractMeta(html, "og:description"),
    ogImage: extractMeta(html, "og:image"),
    twitterTitle: extractMeta(html, "twitter:title"),
    twitterDescription: extractMeta(html, "twitter:description"),
    twitterImage: extractMeta(html, "twitter:image"),
    jsonLd: extractJsonLd(html),
  };
}
