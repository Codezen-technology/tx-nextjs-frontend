import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getLocale, setRequestLocale } from "next-intl/server";
import { ChevronRight, Search } from "lucide-react";
import { fetchRankMathSeo, buildPageMetadata } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { fetchBlogPageGrouped } from "@/lib/services/blog.server";
import { BlogCard } from "@/components/home/blog-card";
import { EmptyState } from "@/components/ui/empty-state";
import { decodeEntities } from "@/lib/api/parsers";
import type { BlogPost, WPCategory } from "@/types/blog";

export const revalidate = 300;

const BLOG_LIST_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Training Excellence Blog",
  description:
    "Tips, guides and industry updates from Training Excellence — compliance training insights to help you and your team stay ahead.",
};

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/blog");
  return buildPageMetadata(seo, {
    title: "Blog | Training Excellence",
    description:
      "Tips, guides and industry updates from Training Excellence — compliance training insights to help you and your team stay ahead.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/blog`,
  });
}

function getFeaturedImage(post: BlogPost): string | undefined {
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

function TrendingPost({ post, category }: { post: BlogPost; category?: WPCategory }) {
  const image = getFeaturedImage(post);
  const title = decodeEntities(post.title.rendered);
  const excerpt = decodeEntities(post.excerpt.rendered)
    .replace(/<[^>]+>/g, "")
    .trim();

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid grid-cols-1 overflow-hidden rounded-xl border border-[#ebedf1] bg-white transition-shadow hover:shadow-lg md:grid-cols-2"
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
        <div className="flex items-center gap-0 font-open-sans text-sm font-semibold">
          {category && <span className="text-primary-500">{category.name}</span>}
          {category && <span className="mx-2 text-neutral-400">•</span>}
          <span className="text-neutral-400">{formatDate(post.date)}</span>
        </div>
        <h2 className="font-suse text-2xl font-bold leading-snug text-[#00204a] transition-colors group-hover:text-primary-500 md:text-3xl">
          {title}
        </h2>
        {excerpt && (
          <p className="line-clamp-3 font-open-sans text-base text-[#3b5374]">{excerpt}</p>
        )}
        <span className="inline-flex items-center gap-1 font-open-sans text-base font-semibold text-secondary-500">
          Read more <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

export default async function BlogPage() {
  const { trending, categorySections, allPosts } = await fetchBlogPageGrouped(40);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BLOG_LIST_SCHEMA) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#00204a] py-14 md:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="container relative">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="font-open-sans text-sm font-normal text-white/70">
                Training Excellence&apos;s
              </p>
              <h1 className="mt-1 font-suse text-4xl font-bold text-white md:text-5xl">
                Blogs &amp; Updates
              </h1>
              <p className="mt-3 font-open-sans text-base text-white/70">
                Your Go-To Hub for Insights &amp; Career-Boosting Knowledge.
              </p>
            </div>
            <form
              action="/blog/search"
              method="get"
              className="flex w-full max-w-sm shrink-0 overflow-hidden rounded-lg shadow-lg"
            >
              <input
                name="q"
                type="search"
                placeholder="Search..."
                className="flex-1 bg-white px-4 py-3 font-open-sans text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-2 bg-secondary-500 px-5 py-3 font-open-sans text-sm font-semibold text-white transition-colors hover:bg-secondary-600"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Trending Topics */}
      {trending && (
        <section className="bg-[#f5f3ee] py-12 md:py-16">
          <div className="container">
            <h2 className="mb-6 font-suse text-2xl font-bold text-[#00204a]">Trending Topics</h2>
            <TrendingPost
              post={trending}
              category={
                trending.categories?.[0]
                  ? categorySections.find((s) => s.category.id === trending.categories![0])
                      ?.category
                  : undefined
              }
            />
          </div>
        </section>
      )}

      {/* Category sections */}
      {categorySections.length > 0 ? (
        <section className="py-12 md:py-16">
          <div className="container space-y-14">
            {categorySections.map(({ category, posts }) => (
              <div key={category.id}>
                <div className="mb-6 flex items-end justify-between">
                  <h2 className="font-suse text-2xl font-bold text-[#00204a]">{category.name}</h2>
                  <Link
                    href={`/blog/category/${category.slug}`}
                    className="flex items-center gap-1 font-open-sans text-sm font-semibold text-secondary-500 hover:text-secondary-600"
                  >
                    View more <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} category={category} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : allPosts.length > 0 ? (
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {allPosts.slice(0, 12).map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16">
          <div className="container">
            <EmptyState
              title="No posts yet"
              description="Check back soon — new articles are on the way."
            />
          </div>
        </section>
      )}
    </>
  );
}
