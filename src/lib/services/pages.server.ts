/**
 * Server-only fetcher for editor-managed WP pages via lms-backend/v1/pages/{slug}.
 * Tries slugs in order so legal pages keep working across slug variations.
 */
import { serverFetch } from "@/lib/api/server";
import { env } from "@/lib/env";

const lms = `/${env.LMS_NAMESPACE}`;

export interface WpPageContent {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  modified: string;
}

export async function fetchWpPage(slugs: string[]): Promise<WpPageContent | null> {
  for (const slug of slugs) {
    try {
      return await serverFetch<WpPageContent>(`${lms}/pages/${encodeURIComponent(slug)}`, {
        revalidate: 3600,
        tags: [`page:${slug}`],
      });
    } catch {
      // try next slug
    }
  }
  return null;
}
