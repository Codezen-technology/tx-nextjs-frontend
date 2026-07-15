export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  description?: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  date: string;
  modified?: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content?: { rendered: string };
  featured_image_url?: string;
  /** Estimated reading time in minutes (added by the backend Blog_Fields). */
  reading_time?: number;
  link: string;
  categories?: number[];
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url?: string; alt_text?: string }>;
    author?: Array<{
      name?: string;
      description?: string;
      avatar_urls?: Record<string, string>;
    }>;
  };
}
