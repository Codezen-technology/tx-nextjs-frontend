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

export async function fetchBlogPage(page = 1, perPage = 12): Promise<BlogPage> {
  const base = getServerWpJsonBase();
  if (!base) return { posts: [], total: 0, totalPages: 0 };

  const url = `${base}/wp/v2/posts?per_page=${perPage}&page=${page}&_embed=wp:featuredmedia,author`;
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

export async function fetchBlogPageGrouped(perPage = 40): Promise<{
  trending: BlogPost | null;
  categorySections: CategorySection[];
  allPosts: BlogPost[];
}> {
  const base = getServerWpJsonBase();
  if (!base) return { trending: null, categorySections: [], allPosts: [] };

  const [postsRes, cats] = await Promise.all([
    fetch(`${base}/wp/v2/posts?per_page=${perPage}&_embed=wp:featuredmedia,author`, {
      next: { revalidate: 300, tags: ["blog:posts"] },
    }),
    fetchCategories(),
  ]);

  if (!postsRes.ok) return { trending: null, categorySections: [], allPosts: [] };

  const allPosts = ((await postsRes.json()) as BlogPost[]).filter(Boolean);

  const trending = allPosts[0] ?? null;

  const catMap = new Map<number, WPCategory>(cats.map((c) => [c.id, c]));
  const seen = new Set<number>();
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

  return { trending, categorySections, allPosts };
}
