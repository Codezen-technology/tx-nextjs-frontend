/**
 * Server-only blog fetchers (wp/v2) that expose WP pagination headers,
 * which the envelope-unwrapping `serverFetch` cannot surface.
 */
import { getServerWpJsonBase } from "@/lib/env";
import type { BlogPost, WPCategory } from "@/types/blog";

export interface BlogPage {
  posts: BlogPost[];
  total: number;
  totalPages: number;
}

export interface CategorySection {
  category: WPCategory;
  posts: BlogPost[];
}

/**
 * WordPress rejects `per_page` outside 1–100 with HTTP 400 `rest_invalid_param`
 * — not a clamp. A caller asking for "everything" in one page therefore gets an
 * empty result, which is how every blog post disappeared from the sitemap.
 */
const WP_MAX_PER_PAGE = 100;

export async function fetchBlogPage(page = 1, perPage = 12): Promise<BlogPage> {
  const base = getServerWpJsonBase();
  if (!base) return { posts: [], total: 0, totalPages: 0 };

  const bounded = Math.min(Math.max(1, Math.trunc(perPage)), WP_MAX_PER_PAGE);
  const url = `${base}/wp/v2/posts?per_page=${bounded}&page=${page}&_embed=wp:featuredmedia,author`;
  const res = await fetch(url, { next: { revalidate: 300, tags: ["blog:posts"] } });

  if (!res.ok) return { posts: [], total: 0, totalPages: 0 };

  const posts = (await res.json()) as BlogPost[];
  return {
    posts: Array.isArray(posts) ? posts : [],
    total: Number(res.headers.get("X-WP-Total") ?? 0),
    totalPages: Number(res.headers.get("X-WP-TotalPages") ?? 0),
  };
}

export async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  const base = getServerWpJsonBase();
  if (!base) return null;

  const url = `${base}/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=wp:featuredmedia,author`;
  const res = await fetch(url, { next: { revalidate: 300, tags: [`blog:${slug}`] } });

  if (!res.ok) return null;

  const posts = (await res.json()) as BlogPost[];
  return Array.isArray(posts) && posts.length ? posts[0] : null;
}

export async function fetchCategories(): Promise<WPCategory[]> {
  const base = getServerWpJsonBase();
  if (!base) return [];

  const url = `${base}/wp/v2/categories?per_page=100&hide_empty=true&orderby=count&order=desc`;
  const res = await fetch(url, { next: { revalidate: 300, tags: ["blog:categories"] } });

  if (!res.ok) return [];

  const data = (await res.json()) as WPCategory[];
  return Array.isArray(data) ? data : [];
}

const TRENDING_COUNT = 5;
const MOST_RECENT_COUNT = 4;

/** Just the trending slice — cheaper than `fetchBlogPageGrouped()` for pages that don't need category buckets. */
export async function fetchTrending(count = TRENDING_COUNT): Promise<BlogPost[]> {
  const base = getServerWpJsonBase();
  if (!base) return [];

  const url = `${base}/wp/v2/posts?per_page=${count}&_embed=wp:featuredmedia,author`;
  const res = await fetch(url, { next: { revalidate: 300, tags: ["blog:posts"] } });

  if (!res.ok) return [];

  const posts = (await res.json()) as BlogPost[];
  return Array.isArray(posts) ? posts.filter(Boolean) : [];
}

export interface CategoryPage {
  category: WPCategory;
  posts: BlogPost[];
  total: number;
  totalPages: number;
}

export async function fetchPostsByCategory(
  categorySlug: string,
  page = 1,
  perPage = 12,
): Promise<CategoryPage | null> {
  const base = getServerWpJsonBase();
  if (!base) return null;

  const cats = await fetchCategories();
  const category = cats.find((c) => c.slug === categorySlug);
  if (!category) return null;

  const url = `${base}/wp/v2/posts?categories=${category.id}&page=${page}&per_page=${perPage}&_embed=wp:featuredmedia,author`;
  const res = await fetch(url, {
    next: { revalidate: 300, tags: ["blog:posts", `blog:category:${categorySlug}`] },
  });

  if (!res.ok) return { category, posts: [], total: 0, totalPages: 0 };

  const posts = (await res.json()) as BlogPost[];
  return {
    category,
    posts: Array.isArray(posts) ? posts : [],
    total: Number(res.headers.get("X-WP-Total") ?? 0),
    totalPages: Number(res.headers.get("X-WP-TotalPages") ?? 0),
  };
}

export async function fetchBlogPageGrouped(perPage = 40): Promise<{
  trending: BlogPost[];
  mostRecent: BlogPost[];
  categorySections: CategorySection[];
  allPosts: BlogPost[];
}> {
  const base = getServerWpJsonBase();
  if (!base) return { trending: [], mostRecent: [], categorySections: [], allPosts: [] };

  const [postsRes, cats] = await Promise.all([
    fetch(`${base}/wp/v2/posts?per_page=${perPage}&_embed=wp:featuredmedia,author`, {
      next: { revalidate: 300, tags: ["blog:posts"] },
    }),
    fetchCategories(),
  ]);

  if (!postsRes.ok) return { trending: [], mostRecent: [], categorySections: [], allPosts: [] };

  const allPosts = ((await postsRes.json()) as BlogPost[]).filter(Boolean);

  const trending = allPosts.slice(0, TRENDING_COUNT);

  const catMap = new Map<number, WPCategory>(cats.map((c) => [c.id, c]));
  const seen = new Set<number>(trending.map((p) => p.id));
  const grouped = new Map<number, BlogPost[]>();

  for (const post of allPosts) {
    const catId = post.categories?.[0];
    if (!catId || !catMap.has(catId)) continue;
    if (!grouped.has(catId)) grouped.set(catId, []);
    const bucket = grouped.get(catId)!;
    if (bucket.length < 4 && !seen.has(post.id)) {
      bucket.push(post);
      seen.add(post.id);
    }
  }

  const categorySections: CategorySection[] = [];
  grouped.forEach((posts, catId) => {
    const category = catMap.get(catId)!;
    if (posts.length) categorySections.push({ category, posts });
  });

  const mostRecent = allPosts
    .filter((post) => !trending.some((t) => t.id === post.id))
    .slice(0, MOST_RECENT_COUNT);

  return { trending, mostRecent, categorySections, allPosts };
}
