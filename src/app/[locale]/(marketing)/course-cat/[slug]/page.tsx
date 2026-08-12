import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getLocale, setRequestLocale } from "next-intl/server";
import { serverApi } from "@/lib/api/server";
import { normalizeCourse } from "@/lib/services/courses";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { wpPath } from "@/lib/seo/wp-paths";
import { env } from "@/lib/env";
import { CategoryHero } from "@/components/courses/category-hero";
import { CategoryCourses } from "@/components/courses/category-courses";
import { CategoryWhyChooseUs } from "@/components/courses/category-why-choose-us";
import type { PaginatedResponse } from "@/types/api";
import type { Course } from "@/types/course";
import { CourseTrustedStrip } from "@/components/courses/course-trusted-strip";
import { CourseFaq } from "@/components/courses/course-faq";

const fetchCategories = cache(() => serverApi.taxonomy.categories({ per_page: 100 }));

const PER_PAGE = 16;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export async function generateStaticParams() {
  try {
    const result = await serverApi.taxonomy.categories({ per_page: 100 });
    return result.items.map((cat) => ({ slug: cat.slug }));
  } catch {
    return [];
  }
}

/** `?page=N` for N > 1, empty for page 1 — read identically in metadata and page. */
function pageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 1 ? n : 1;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(await getLocale());
  const siteUrl = env.SITE_URL.replace(/\/$/, "");

  // Each page in a paginated series self-references. Canonicalising page 2+ back
  // to page 1 tells Google the deeper pages are duplicates of it.
  const page = pageParam(sp?.page);
  const canonical = `${siteUrl}/course-cat/${slug}${page > 1 ? `?page=${page}` : ""}`;

  try {
    const [categoriesResult, seo] = await Promise.all([
      fetchCategories(),
      // Rank Math is asked about the unparameterised path — WordPress has no
      // metadata for `?page=2`, so title and description are inherited from
      // page 1 and only the canonical differs. That is the intended shape.
      fetchRankMathSeo(wpPath.courseCategory(slug)),
    ]);
    const category = categoriesResult.items.find((c) => c.slug === slug);
    if (!category) return {};
    const metadata = await buildPageMetadata(seo, {
      title: `${category.name} Courses`,
      description:
        category.description ||
        `Browse our accredited ${category.name} online courses. Flexible, CPD-certified training for professionals.`,
      image: category.image ?? undefined,
      canonical,
    });
    // buildPageMetadata prefers Rank Math's canonical, which is always page 1's.
    return {
      ...metadata,
      alternates: { canonical },
      openGraph: { ...metadata.openGraph, url: canonical },
    };
  } catch {
    return {
      title: "Online Courses",
      description: "Browse accredited online training courses.",
      alternates: { canonical },
    };
  }
}

function buildCategorySchema(
  category: { name: string; description?: string; image?: string | null },
  url: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} Courses`,
    ...(category.description ? { description: category.description } : {}),
    url,
    ...(category.image ? { image: category.image } : {}),
    isPartOf: {
      "@type": "WebSite",
      name: env.SITE_NAME || "Training Excellence",
      url: env.SITE_URL,
    },
  };
}

function buildBreadcrumbSchema(
  categoryName: string,
  siteUrl: string,
  categoryUrl: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "All Courses", item: `${siteUrl}/all-courses` },
      { "@type": "ListItem", position: 3, name: categoryName, item: categoryUrl },
    ],
  };
}

export const revalidate = 300;

export default async function CourseCategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(await getLocale());

  const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(rawPage) || 1);

  const [categoriesResult, coursesResult, seoResult] = await Promise.allSettled([
    fetchCategories(),
    serverApi.courses.list({ category: slug, per_page: PER_PAGE, page }),
    fetchRankMathSeo(wpPath.courseCategory(slug)),
  ]);

  const category =
    categoriesResult.status === "fulfilled"
      ? categoriesResult.value.items.find((c) => c.slug === slug)
      : undefined;
  if (!category) notFound();

  const coursesData = coursesResult.status === "fulfilled" ? coursesResult.value : null;
  const rmSeo = seoResult.status === "fulfilled" ? seoResult.value : null;

  const courses: Course[] = (coursesData?.items ?? []).map((raw) =>
    normalizeCourse(raw as Parameters<typeof normalizeCourse>[0]),
  );

  const coursesPageData: PaginatedResponse<Course> = {
    items: courses,
    total: coursesData?.total ?? 0,
    totalPages: coursesData?.totalPages ?? 1,
    page,
    perPage: PER_PAGE,
  };

  const siteUrl = env.SITE_URL.replace(/\/$/, "");
  const categoryUrl = rmSeo?.canonical ?? `${siteUrl}/course-cat/${slug}`;
  const jsonLd = rmSeo?.jsonLd?.length
    ? rmSeo.jsonLd
    : [
        buildCategorySchema(category, categoryUrl),
        buildBreadcrumbSchema(category.name, siteUrl, categoryUrl),
      ];

  const categoryFaq = category.faq ?? [];

  return (
    <div className="bg-white">
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(schema) }}
        />
      ))}

      {/* Trusted Topbar */}
      <CourseTrustedStrip />

      <CategoryHero category={category} />
      <CategoryCourses
        data={coursesPageData}
        categoryName={category.name}
        categoryDescription={category.description || null}
        currentPage={page}
        basePath={`/course-cat/${slug}`}
      />

      {/* FAQ */}
      {categoryFaq.length > 0 && (
        <div className="container py-12">
          <CourseFaq
            heading={`Frequently Asked Questions About ${category.name} Training`}
            items={categoryFaq}
          />
        </div>
      )}

      <CategoryWhyChooseUs
        whyChooseUs={category.why_choose_us ?? category.image}
        categoryName={category.name}
      />
    </div>
  );
}
