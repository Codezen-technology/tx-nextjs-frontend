import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, setRequestLocale } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { decodeEntities } from "@/lib/api/parsers";
import { fetchBlogPageGrouped } from "@/lib/services/blog.server";
import { BlogCard } from "@/components/home/blog-card";
import { BlogHero } from "@/components/home/blog-hero";
import { TrendingCarousel } from "@/components/home/trending-carousel";
import { BlogTeamCta } from "@/components/home/blog-team-cta";
import { EmptyState } from "@/components/ui/empty-state";

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

export default async function BlogPage() {
  const { trending, mostRecent, categorySections, allPosts } = await fetchBlogPageGrouped(40);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(BLOG_LIST_SCHEMA) }}
      />

      <BlogHero />

      {/* Trending Topics */}
      {trending.length > 0 && (
        <section className="bg-[#f5f3ee] py-12 md:py-16">
          <div className="container">
            <h2 className="font-suse mb-6 text-2xl font-bold text-neutral-900">Trending Topics</h2>
            <TrendingCarousel posts={trending} categorySections={categorySections} />
          </div>
        </section>
      )}

      {/* Most Recent */}
      {mostRecent.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container">
            <h2 className="font-suse mb-6 text-2xl font-bold text-neutral-900">Most Recent</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {mostRecent.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
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
                  <h2 className="font-suse text-2xl font-bold text-neutral-900">
                    {decodeEntities(category.name)}
                  </h2>
                  <Link
                    href={`/blog/category/${category.slug}`}
                    className="font-open-sans text-secondary-500 hover:text-secondary-600 flex items-center gap-1 text-sm font-semibold"
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
              {allPosts
                .filter(
                  (post) =>
                    !trending.some((t) => t.id === post.id) &&
                    !mostRecent.some((m) => m.id === post.id),
                )
                .slice(0, 12)
                .map((post) => (
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

      <BlogTeamCta />
    </>
  );
}
