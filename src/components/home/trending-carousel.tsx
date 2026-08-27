"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { decodeEntities } from "@/lib/api/parsers";
import { formatCardDate } from "@/lib/utils/format";
import type { BlogPost, WPCategory } from "@/types/blog";
import type { CategorySection } from "@/lib/services/blog.server";

interface TrendingCarouselProps {
  posts: BlogPost[];
  categorySections: CategorySection[];
}

function getFeaturedImage(post: BlogPost): string | undefined {
  return post.featured_image_url ?? post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
}

function TrendingPostCard({ post, category }: { post: BlogPost; category?: WPCategory }) {
  const image = getFeaturedImage(post);
  const title = decodeEntities(post.title.rendered);
  const excerpt = decodeEntities(post.excerpt.rendered)
    .replace(/<[^>]+>/g, "")
    .trim();

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group border-neutral-30 grid grid-cols-1 overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-lg md:grid-cols-2"
    >
      <div className="relative min-h-[260px] overflow-hidden bg-neutral-100 md:min-h-[340px]">
        {image && (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
        )}
      </div>
      <div className="flex flex-col justify-center gap-4 p-8 md:p-10">
        <div className="font-open-sans flex items-center gap-0 text-sm font-semibold">
          {category && <span className="text-primary-500">{decodeEntities(category.name)}</span>}
          {category && <span className="mx-2 text-neutral-400">•</span>}
          <span className="text-neutral-400">{formatCardDate(post.date)}</span>
        </div>
        <h2 className="font-suse group-hover:text-primary-500 text-2xl leading-snug font-bold text-neutral-900 transition-colors md:text-3xl">
          {title}
        </h2>
        {excerpt && (
          <p className="font-open-sans line-clamp-3 text-base text-neutral-500">{excerpt}</p>
        )}
        {/* Not a button or a link: the whole card is the <a>, so an interactive
            element here would be invalid markup. The hover affordance the report
            asks for (QA-BLOG-A5) is driven by the card's `group`, the same way the
            title above already is. */}
        <span className="bg-secondary-600 group-hover:bg-secondary-700 font-open-sans inline-flex w-fit items-center justify-center rounded-full px-6 py-4 text-base text-white transition-colors">
          Read this article
        </span>
      </div>
    </Link>
  );
}

export function TrendingCarousel({ posts, categorySections }: TrendingCarouselProps) {
  const [active, setActive] = useState(0);

  if (posts.length === 0) return null;

  const total = posts.length;
  const prev = () => setActive((a) => (a - 1 + total) % total);
  const next = () => setActive((a) => (a + 1) % total);

  const post = posts[active];
  const category = post.categories?.[0]
    ? categorySections.find((s) => s.category.id === post.categories![0])?.category
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <TrendingPostCard post={post} category={category} />

      {total > 1 && (
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={prev}
            aria-label="Previous trending post"
            className="text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1">
            {posts.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Go to trending post ${i + 1}`}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-200",
                  i === active
                    ? "scale-125 bg-neutral-900"
                    : "border border-neutral-400 bg-transparent hover:bg-neutral-900",
                )}
              />
            ))}
          </div>
          <button
            onClick={next}
            aria-label="Next trending post"
            className="text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
