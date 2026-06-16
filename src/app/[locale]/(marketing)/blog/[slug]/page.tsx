import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, UserRound } from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { fetchBlogPost, fetchBlogPage, fetchCategories } from "@/lib/services/blog.server";
import { decodeEntities } from "@/lib/api/parsers";
import { ParsedHtml } from "@/components/ui/parsed-html";
import { BlogCard } from "@/components/home/blog-card";
import { BlogPostSidebar } from "@/components/blog/blog-post-sidebar";
import { parseToc } from "@/lib/utils/toc";
import type { BlogPost } from "@/types/blog";

export const revalidate = 300;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

function getPostImage(post: BlogPost): { url?: string; alt?: string } {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  return {
    url: post.featured_image_url ?? media?.source_url,
    alt: media?.alt_text || decodeEntities(post.title.rendered),
  };
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

export async function generateStaticParams() {
  try {
    const { posts } = await fetchBlogPage(1, 500);
    return posts.flatMap(({ slug }) => (slug ? [{ slug }] : []));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  setRequestLocale(await getLocale());
  try {
    const [post, seo] = await Promise.all([fetchBlogPost(slug), fetchRankMathSeo(`/${slug}`)]);
    if (!post) return { title: "Post not found" };
    return buildPageMetadata(seo, {
      title: decodeEntities(post.title.rendered),
      description: decodeEntities(post.excerpt.rendered)
        .replace(/<[^>]+>/g, "")
        .trim()
        .slice(0, 160),
      image: getPostImage(post).url,
      canonical: `${env.SITE_URL.replace(/\/$/, "")}/blog/${slug}`,
    });
  } catch {
    return { title: "Post not found" };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [pR, sR, rR, catsR] = await Promise.allSettled([
    fetchBlogPost(slug),
    fetchRankMathSeo(`/${slug}`),
    fetchBlogPage(1, 5),
    fetchCategories(),
  ]);

  const post = pR.status === "fulfilled" ? pR.value : null;
  if (!post) notFound();

  const rmSeo = sR.status === "fulfilled" ? sR.value : null;
  const { posts: related } = rR.status === "fulfilled" ? rR.value : { posts: [] as BlogPost[] };
  const cats = catsR.status === "fulfilled" ? catsR.value : [];

  const title = decodeEntities(post.title.rendered);
  const image = getPostImage(post);
  const author = post._embedded?.author?.[0];
  const morePosts = related.filter((p) => p.id !== post.id).slice(0, 3);

  const catMap = new Map(cats.map((c) => [c.id, c]));
  const postCategory = post.categories?.[0] ? catMap.get(post.categories[0]) : undefined;

  const rawContent = post.content?.rendered ?? "";
  const { toc, content: contentWithIds } = parseToc(rawContent);

  const contributors = author ? [author] : [];

  const jsonLd = rmSeo?.jsonLd?.length
    ? rmSeo.jsonLd
    : [
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          datePublished: post.date,
          ...(image.url ? { image: [image.url] } : {}),
          ...(author?.name ? { author: { "@type": "Person", name: author.name } } : {}),
        },
      ];

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#00204a] pb-10 pt-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="container relative">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 font-open-sans text-sm text-white/60"
          >
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/blog" className="transition-colors hover:text-white">
              Blog
            </Link>
            {postCategory && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link
                  href={`/blog/category/${postCategory.slug}`}
                  className="transition-colors hover:text-white"
                >
                  {postCategory.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="line-clamp-1 text-white/90">{title}</span>
          </nav>

          <h1 className="mt-5 max-w-3xl font-suse text-3xl font-bold leading-tight text-white md:text-4xl">
            {title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 font-open-sans text-sm text-white/70">
            {postCategory && (
              <span className="rounded-full bg-primary-500/20 px-3 py-1 font-semibold text-primary-400">
                {postCategory.name}
              </span>
            )}
            {author?.name && (
              <span className="flex items-center gap-1.5">
                <UserRound className="h-4 w-4" />
                {author.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formatDate(post.date)}
            </span>
          </div>
        </div>
      </section>

      {/* Article + sidebar */}
      <div className="py-12">
        <div className="container">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
            {/* Sticky sidebar */}
            {(toc.length > 0 || contributors.length > 0) && (
              <div className="order-2 w-full shrink-0 lg:sticky lg:top-24 lg:order-1 lg:w-72">
                <BlogPostSidebar toc={toc} contributors={contributors} />
              </div>
            )}

            {/* Main content */}
            <article className="order-1 min-w-0 flex-1 lg:order-2">
              {image.url && (
                <div className="relative mb-10 aspect-video w-full overflow-hidden rounded-xl bg-neutral-100">
                  <Image
                    src={image.url}
                    alt={image.alt ?? title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, calc(100vw - 336px)"
                    className="object-cover"
                  />
                </div>
              )}
              <ParsedHtml
                as="div"
                className="prose-wp font-open-sans text-[#3b5374]"
                content={contentWithIds}
              />
            </article>
          </div>
        </div>
      </div>

      {/* Related posts */}
      {morePosts.length > 0 && (
        <section className="border-t border-[#ebedf1] bg-[#f5f3ee] py-14">
          <div className="container">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-suse text-2xl font-bold text-[#00204a]">More from the blog</h2>
              <Link
                href="/blog"
                className="flex items-center gap-1 font-open-sans text-sm font-semibold text-secondary-500 hover:text-secondary-600"
              >
                View all posts <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {morePosts.map((p) => (
                <BlogCard
                  key={p.id}
                  post={p}
                  category={p.categories?.[0] ? catMap.get(p.categories[0]) : undefined}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
