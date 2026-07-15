import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { fetchBlogPost, fetchBlogPage, fetchCategories } from "@/lib/services/blog.server";
import { serverApi } from "@/lib/api/server";
import { normalizeCourse } from "@/lib/services/courses";
import { decodeEntities } from "@/lib/api/parsers";
import { ParsedHtml } from "@/components/ui/parsed-html";
import { BlogCard } from "@/components/home/blog-card";
import { BlogPostSidebar } from "@/components/blog/blog-post-sidebar";
import { BlogShareCard } from "@/components/blog/blog-share-card";
import { CourseCard } from "@/components/courses/course-card";
import { CourseFaq } from "@/components/courses/course-faq";
import { parseToc } from "@/lib/utils/toc";
import { parseFaq } from "@/lib/utils/faq";
import { cn } from "@/lib/utils/cn";
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
    const params = (posts ?? []).flatMap((p) => (p.slug ? [{ slug: p.slug }] : []));
    return params.length > 0 ? params : [{ slug: "__lms_static_params_placeholder__" }];
  } catch {
    return [{ slug: "__lms_static_params_placeholder__" }];
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
  const [pR, sR, rR, catsR, coursesR] = await Promise.allSettled([
    fetchBlogPost(slug),
    fetchRankMathSeo(`/${slug}`),
    fetchBlogPage(1, 6),
    fetchCategories(),
    serverApi.courses.popular(4),
  ]);

  const post = pR.status === "fulfilled" ? pR.value : null;
  if (!post) notFound();

  const rmSeo = sR.status === "fulfilled" ? sR.value : null;
  const { posts: related } = rR.status === "fulfilled" ? rR.value : { posts: [] as BlogPost[] };
  const cats = catsR.status === "fulfilled" ? catsR.value : [];
  const relatedCourses =
    coursesR.status === "fulfilled"
      ? (coursesR.value.items ?? []).map((raw) =>
          normalizeCourse(raw as Parameters<typeof normalizeCourse>[0]),
        )
      : [];

  const title = decodeEntities(post.title.rendered);
  const excerpt = decodeEntities(post.excerpt.rendered)
    .replace(/<[^>]+>/g, "")
    .trim();
  const image = getPostImage(post);
  const author = post._embedded?.author?.[0];
  const morePosts = related.filter((p) => p.id !== post.id).slice(0, 4);
  const canonicalUrl = `${env.SITE_URL.replace(/\/$/, "")}/blog/${slug}`;

  const catMap = new Map(cats.map((c) => [c.id, c]));
  const postCategory = post.categories?.[0] ? catMap.get(post.categories[0]) : undefined;

  const rawContent = post.content?.rendered ?? "";
  const { toc, content: contentWithToc } = parseToc(rawContent);
  const { faq, heading: faqHeading, content: contentWithIds } = parseFaq(contentWithToc);

  const hasSidebar = toc.length > 0;

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
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(schema) }}
        />
      ))}

      {/* Hero */}
      <section
        className="relative overflow-hidden py-12 lg:py-16"
        style={{
          backgroundImage: "linear-gradient(84deg, #00204a 0%, #004f65 100%)",
        }}
      >
        <div className="relative container">
          <nav
            aria-label="Breadcrumb"
            className="font-open-sans flex items-center gap-1 text-sm text-white/60"
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

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="lg:max-w-xl">
              <h1 className="font-suse text-3xl leading-tight font-bold text-white sm:text-4xl lg:text-[40px]">
                {title}
              </h1>
              {excerpt && (
                <p className="font-open-sans text-neutral-20 mt-4 text-base font-light sm:text-lg">
                  {excerpt}
                </p>
              )}
              <div className="font-open-sans mt-6 flex flex-wrap items-center gap-2 text-sm font-semibold">
                {postCategory && (
                  <>
                    <span className="text-primary-500">{postCategory.name}</span>
                    <span className="text-neutral-10 font-normal">•</span>
                  </>
                )}
                <span className="text-neutral-10 font-normal">{formatDate(post.date)}</span>
              </div>
            </div>

            {image.url && (
              <div className="relative aspect-634/370 w-full shrink-0 overflow-hidden rounded-md border-4 border-white sm:border-8 lg:w-105 xl:w-125">
                <Image
                  src={image.url}
                  alt={image.alt ?? title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 500px"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Article + sidebar + share */}
      <div className="py-12">
        <div className="container">
          <div
            className={cn(
              "grid grid-cols-1 gap-10 xl:items-start xl:gap-8",
              hasSidebar
                ? "xl:grid-cols-[306px_minmax(0,1fr)_306px]"
                : "xl:grid-cols-[minmax(0,1fr)_306px]",
            )}
          >
            {/* TOC / contributors */}
            {hasSidebar && (
              <div className="order-2 w-full xl:sticky xl:top-8 xl:order-1 xl:self-start">
                <BlogPostSidebar toc={toc} />
              </div>
            )}

            {/* Main content */}
            <article className="order-1 min-w-0 xl:order-2">
              {image.url && (
                <div className="relative mb-10 aspect-video w-full overflow-hidden rounded-xl bg-neutral-100">
                  <Image
                    src={image.url}
                    alt={image.alt ?? title}
                    fill
                    sizes="(max-width: 1280px) 100vw, calc(100vw - 700px)"
                    className="object-cover"
                  />
                </div>
              )}
              <ParsedHtml
                as="div"
                className="prose-wp font-open-sans text-neutral-500"
                content={contentWithIds}
              />
              {faq.length > 0 && (
                <div className="mt-12">
                  <CourseFaq heading={faqHeading} items={faq} />
                </div>
              )}
            </article>

            {/* Share / promo */}
            <div className="order-3 w-full xl:sticky xl:top-8 xl:self-start">
              <BlogShareCard url={canonicalUrl} title={title} />
            </div>
          </div>
        </div>
      </div>

      {/* Related courses */}
      {relatedCourses.length > 0 && (
        <section className="border-neutral-30 border-t bg-white py-14">
          <div className="container">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-suse text-2xl font-bold text-neutral-900">Related Courses</h2>
              <Link
                href="/all-courses"
                className="font-open-sans text-secondary-500 hover:text-secondary-600 flex items-center gap-1 text-sm font-semibold"
              >
                View all courses <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related posts */}
      {morePosts.length > 0 && (
        <section className="border-neutral-30 border-t bg-[#f5f3ee] py-14">
          <div className="container">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-suse text-2xl font-bold text-neutral-900">More Blogs</h2>
              <Link
                href="/blog"
                className="font-open-sans text-secondary-500 hover:text-secondary-600 flex items-center gap-1 text-sm font-semibold"
              >
                View all posts <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
