# SEO — Rank Math Headless Pattern

This project uses Rank Math's headless CMS API for all server-rendered page metadata.

**Source of truth:** Rank Math on the WP backend (`trainingexcellence.org.uk`) holds all SEO configuration — meta titles, descriptions, robots rules, Open Graph, and JSON-LD structured data. The Next.js frontend fetches it at render time and injects it into the page.

---

## Required WP Setup

Rank Math → General Settings → Others → **Headless CMS Support: ON**

Without this, `fetchRankMathSeo` returns `null` for every page and falls back to manual metadata.

---

## The Pattern — every SSR/ISR page must follow this

### 1. `generateMetadata` (required on every public page)

```ts
import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata } from "@/lib/seo/server";
import { env } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/your-wp-path");
  return buildPageMetadata(seo, {
    title: "Fallback Title",
    description: "Fallback description (max 160 chars).",
    canonical: `${env.SITE_URL}/your-path`,
  });
}
```

### 2. Dynamic pages — fetch SEO in parallel with page data

Do NOT make a separate `await` for SEO. Use `Promise.allSettled` so a Rank Math failure never blocks the page:

```ts
export default async function MyPage({ params }) {
  const [dataResult, seoResult] = await Promise.allSettled([
    serverApi.something.get(params.slug),
    fetchRankMathSeo(`/your-wp-path/${params.slug}`),
  ]);

  if (dataResult.status === "rejected") notFound();

  const data = dataResult.value;
  const rmSeo = seoResult.status === "fulfilled" ? seoResult.value : null;

  // JSON-LD: prefer Rank Math's blocks, fall back to manual schema
  const jsonLd = rmSeo?.jsonLd?.length ? rmSeo.jsonLd : [buildMySchema(data)];

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      {/* page content */}
    </>
  );
}
```

### 3. `generateStaticParams` (required on dynamic slug pages)

Pre-renders all known slugs at build time. ISR handles new entries at runtime.

```ts
export async function generateStaticParams() {
  try {
    const data = await serverApi.courses.list({ per_page: 500 });
    const items = Array.isArray(data)
      ? data
      : ((data as { items?: { slug: string }[] }).items ?? []);
    return (items as { slug: string }[]).flatMap(({ slug }) => (slug ? [{ slug }] : []));
  } catch {
    return [];
  }
}
```

---

## How `fetchRankMathSeo` works

```
Next.js page render
  → fetchRankMathSeo("/course/my-slug")
    → GET /wp-json/rankmath/v1/getHead?url=https://trainingexcellence.org.uk/course/my-slug
      → returns { success: true, head: "<html string of <head> tags>" }
    → parseRankMathHead(head)   ← regex-extracts all SEO fields
    → patches canonical: replaces WP origin with NEXT_PUBLIC_SITE_URL
    → patches JSON-LD: replaces WP origin in all @id / url fields
  → returns ParsedSeo | null
```

**Domain patching is automatic.** Rank Math's canonical and JSON-LD reference the WP domain. `fetchRankMathSeo` rewrites every occurrence to the headless frontend URL so Google indexes the right domain.

---

## WP path vs Next.js path

In most cases they are identical. Verify against the live WP site if a page returns `null`:

| Next.js route    | WP path to pass               |
| ---------------- | ----------------------------- |
| `/`              | `/`                           |
| `/course/[slug]` | `/course/${slug}`             |
| `/blog/[slug]`   | `/${slug}` or `/blog/${slug}` |
| `/about`         | `/about`                      |

Use browser DevTools on `trainingexcellence.org.uk` → inspect `<link rel="canonical">` to confirm the WP path for any page.

---

## Fallback behavior

`fetchRankMathSeo` never throws. It returns `null` when:

- Rank Math headless mode is disabled
- The `rankmath/v1/getHead` endpoint returns an error
- Network failure reaching WP

`buildPageMetadata` uses the `fallback` values for any `null` or missing Rank Math fields. **Every public page must have non-empty fallback title, description, and canonical.** Google will use these on the first crawl before Rank Math is configured for a page.

---

## `buildPageMetadata` output

Given Rank Math SEO data, it produces:

```ts
{
  title: "...",             // from RM or fallback
  description: "...",       // from RM or fallback
  robots: "...",            // from RM only (omitted if absent)
  alternates: {
    canonical: "https://trainingexcellence.com/...",  // always headless domain
  },
  openGraph: {
    title, description, url, type: "website", images: [...]
  },
  twitter: {
    card: "summary_large_image", title, description, images: [...]
  }
}
```

---

## Key files

| File                    | Purpose                                                 |
| ----------------------- | ------------------------------------------------------- |
| `src/lib/seo/server.ts` | `fetchRankMathSeo` + `buildPageMetadata`                |
| `src/lib/utils/seo.ts`  | `parseRankMathHead` — HTML parser (used internally)     |
| `src/lib/api/server.ts` | `serverApi.rankmath.getHead` — raw fetch with ISR cache |

---

## Checklist for every new public page

- [ ] `generateMetadata` calls `fetchRankMathSeo` + `buildPageMetadata`
- [ ] `generateStaticParams` on dynamic `[slug]` pages
- [ ] Fallback `title`, `description`, `canonical` provided to `buildPageMetadata`
- [ ] JSON-LD: use `rmSeo?.jsonLd` or fall back to manual schema.org block
- [ ] WP path verified against live site canonical
