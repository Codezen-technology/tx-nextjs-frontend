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
        "flex flex-col overflow-hidden rounded-lg border border-[#ebedf1] bg-white transition-shadow hover:shadow-md",
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
            <div className="h-full w-full bg-primary-50" />
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 px-6 py-4">
        <div className="flex items-center gap-0 font-open-sans text-sm font-semibold">
          {category ? <span className="text-primary-500">{category.name}</span> : null}
          {category && <span className="mx-2 text-neutral-400">•</span>}
          <span className="text-neutral-400">{formatDate(post.date)}</span>
          {post.reading_time ? (
            <>
              <span className="mx-2 text-neutral-400">•</span>
              <span className="text-neutral-400">{post.reading_time} min read</span>
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Link href={`/blog/${post.slug}`}>
            <h3 className="line-clamp-2 font-suse text-xl font-bold leading-snug text-[#00204a] transition-colors hover:text-primary-500">
              {title}
            </h3>
          </Link>
          {excerpt && (
            <p className="line-clamp-3 font-open-sans text-base text-[#3b5374]">{excerpt}</p>
          )}
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className="mt-auto inline-flex items-center gap-1 font-open-sans text-base text-secondary-500 transition-colors hover:text-secondary-600"
        >
          Read more <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
