import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, setRequestLocale } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { wpPath } from "@/lib/seo/wp-paths";
import { env } from "@/lib/env";
import { decodeEntities } from "@/lib/api/parsers";
import { fetchTrending, fetchPostsByCategory, fetchCategories } from "@/lib/services/blog.server";
import { BlogHero } from "@/components/home/blog-hero";
import { TrendingCarousel } from "@/components/home/trending-carousel";
import { BlogCard } from "@/components/home/blog-card";
import { BlogTeamCta } from "@/components/home/blog-team-cta";
import { EmptyState } from "@/components/ui/empty-state";

export const revalidate = 300;

const PER_PAGE = 12;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export async function generateStaticParams() {
  try {
    const cats = await fetchCategories();
    return cats.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  setRequestLocale(await getLocale());
  const siteUrl = env.SITE_URL.replace(/\/$/, "");

  const [result, seo] = await Promise.all([
    fetchPostsByCategory(slug, 1, PER_PAGE),
    fetchRankMathSeo(wpPath.blogCategory(slug)),
  ]);
  if (!result) return {};

  const categoryName = decodeEntities(result.category.name);
  return buildPageMetadata(seo, {
    title: `${categoryName} — Blog`,
    description:
      result.category.description ||
      `Browse ${categoryName} articles and updates from Training Excellence.`,
    canonical: `${siteUrl}/blog/category/${slug}`,
  });
}

function pageHref(basePath: string, p: number) {
  return p <= 1 ? basePath : `${basePath}?page=${p}`;
}

function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 4) pages.push("...");
  for (let p = Math.max(2, current - 2); p <= Math.min(total - 1, current + 2); p++) {
    pages.push(p);
  }
  if (current < total - 3) pages.push("...");
  pages.push(total);
  return pages;
}

export default async function BlogCategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(await getLocale());

  const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(rawPage) || 1);

  const [trending, result] = await Promise.all([
    fetchTrending(5),
    fetchPostsByCategory(slug, page, PER_PAGE),
  ]);

  if (!result) notFound();

  const { category, posts, totalPages } = result;
  const categoryName = decodeEntities(category.name);
  const basePath = `/blog/category/${slug}`;
  const siteUrl = env.SITE_URL.replace(/\/$/, "");

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryName} — Training Excellence Blog`,
    ...(category.description ? { description: category.description } : {}),
    url: `${siteUrl}${basePath}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(schema) }}
      />

      <BlogHero />

      {trending.length > 0 && (
        <section className="bg-[#f5f3ee] py-12 md:py-16">
          <div className="container">
            <h2 className="font-suse mb-6 text-2xl font-bold text-neutral-900">Trending Topics</h2>
            <TrendingCarousel posts={trending} categorySections={[]} />
          </div>
        </section>
      )}

      <section className="py-12 md:py-16">
        <div className="container">
          <div className="mb-6">
            <h1 className="font-suse text-2xl font-bold text-neutral-900">{categoryName}</h1>
            {category.description && (
              <p className="font-open-sans mt-2 max-w-2xl text-base text-neutral-500">
                {category.description}
              </p>
            )}
          </div>

          {posts.length === 0 ? (
            <EmptyState
              title="No posts yet"
              description="Check back soon — new articles are on the way."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} category={category} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav aria-label="Blog pages" className="mt-10 flex items-center justify-center gap-2">
              {page === 1 ? (
                <span
                  aria-label="Previous page"
                  aria-disabled="true"
                  className="border-neutral-30 flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border text-neutral-500 opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </span>
              ) : (
                <Link
                  href={pageHref(basePath, page - 1)}
                  aria-label="Previous page"
                  className="border-neutral-30 flex h-9 w-9 items-center justify-center rounded-full border text-neutral-500 transition-colors hover:bg-neutral-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              )}

              {buildPageRange(page, totalPages).map((p, i) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="font-open-sans px-1 text-sm text-neutral-400"
                  >
                    …
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={pageHref(basePath, p as number)}
                    aria-current={page === p ? "page" : undefined}
                    className={`font-open-sans flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-colors ${
                      page === p
                        ? "border-secondary-500 bg-secondary-600 text-white"
                        : "border-neutral-30 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {p}
                  </Link>
                ),
              )}

              {page === totalPages ? (
                <span
                  aria-label="Next page"
                  aria-disabled="true"
                  className="border-neutral-30 flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border text-neutral-500 opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </span>
              ) : (
                <Link
                  href={pageHref(basePath, page + 1)}
                  aria-label="Next page"
                  className="border-neutral-30 flex h-9 w-9 items-center justify-center rounded-full border text-neutral-500 transition-colors hover:bg-neutral-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </nav>
          )}
        </div>
      </section>

      <BlogTeamCta />
    </>
  );
}
