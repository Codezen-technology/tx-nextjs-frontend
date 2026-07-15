import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { decodeEntities } from "@/lib/api/parsers";
import type { BlogPost, WPCategory } from "@/types/blog";

interface BlogCardProps {
  post: BlogPost;
  category?: WPCategory;
  className?: string;
}

function getPostImage(post: BlogPost): string | undefined {
  return post.featured_image_url ?? post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function BlogCard({ post, category, className }: BlogCardProps) {
  const image = getPostImage(post);
  const title = decodeEntities(post.title.rendered);
  const excerpt = decodeEntities(post.excerpt.rendered)
    .replace(/<[^>]+>/g, "")
    .trim();

  return (
    <div
      className={cn(
        "border-neutral-30 flex flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md",
        className,
      )}
    >
      <Link href={`/blog/${post.slug}`} className="block shrink-0">
        <div className="relative h-[200px] w-full overflow-hidden bg-neutral-100">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="bg-primary-50 h-full w-full" />
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 px-6 py-4">
        <div className="font-open-sans flex items-center gap-0 text-sm font-semibold">
          {category ? (
            <span className="text-primary-500">{decodeEntities(category.name)}</span>
          ) : null}
          {category && <span className="mx-2 text-neutral-400">•</span>}
          <span className="text-neutral-400">{formatDate(post.date)}</span>
        </div>

        <div className="flex flex-col gap-2">
          <Link href={`/blog/${post.slug}`}>
            <h3 className="font-suse hover:text-primary-500 line-clamp-2 text-xl leading-snug font-bold text-neutral-900 transition-colors">
              {title}
            </h3>
          </Link>
          {excerpt && (
            <p className="font-open-sans line-clamp-3 text-base text-neutral-500">{excerpt}</p>
          )}
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className="font-open-sans text-secondary-500 hover:text-secondary-600 mt-auto inline-flex items-center gap-1 text-base transition-colors"
        >
          Read more <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
