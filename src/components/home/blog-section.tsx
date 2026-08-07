import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BlogCard } from "./blog-card";
import { blogService } from "@/lib/services/blog";
import type { BlogPost } from "@/types/blog";

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    return await blogService.list({ perPage: 4 });
  } catch {
    return [];
  }
}

export async function BlogSection() {
  const posts = await getBlogPosts();

  if (!posts.length) return null;

  return (
    <section className="py-16">
      <div className="container">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-suse text-3xl font-bold text-neutral-900">Latest from Our Blog</h2>
            <p className="font-open-sans mt-1 text-neutral-500">
              Tips, guides and industry updates to help you stay ahead.
            </p>
          </div>
          <Link
            href="/blog"
            className="font-open-sans text-secondary-500 hover:text-secondary-600 flex items-center gap-1 text-sm font-semibold"
          >
            View all posts <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
