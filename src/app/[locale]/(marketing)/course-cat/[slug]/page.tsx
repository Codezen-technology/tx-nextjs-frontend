import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getLocale, setRequestLocale } from "next-intl/server";
import { serverApi } from "@/lib/api/server";
import { normalizeCourse } from "@/lib/services/courses";
import { fetchRankMathSeo, buildPageMetadata } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { CategoryHero } from "@/components/courses/category-hero";
import { CategoryCourses } from "@/components/courses/category-courses";
import { CategoryWhyChooseUs } from "@/components/courses/category-why-choose-us";
import type { PaginatedResponse } from "@/types/api";
import type { Course } from "@/types/course";

const fetchCategories = cache(() => serverApi.taxonomy.categories({ per_page: 100 }));

const PER_PAGE = 30;

interface PageProps {
  params: { locale: string; slug: string };
  searchParams: { page?: string | string[] };
}

export async function generateStaticParams() {
  try {
    const result = await serverApi.taxonomy.categories({ per_page: 100 });
    return result.items.map((cat) => ({ slug: cat.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const siteUrl = env.SITE_URL.replace(/\/$/, "");
  try {
    const [categoriesResult, seo] = await Promise.all([
      fetchCategories(),
      fetchRankMathSeo(`/course-category/${params.slug}`),
    ]);
    const category = categoriesResult.items.find((c) => c.slug === params.slug);
    if (!category) return {};
    return buildPageMetadata(seo, {
      title: `${category.name} Courses | Training Excellence`,
      description:
        category.description ||
        `Browse our accredited ${category.name} online courses. Flexible, CPD-certified training for professionals.`,
      image: category.image ?? undefined,
      canonical: `${siteUrl}/course-cat/${params.slug}`,
    });
  } catch {
    return {
      title: "Online Courses | Training Excellence",
      description: "Browse accredited online training courses.",
      alternates: { canonical: `${siteUrl}/course-cat/${params.slug}` },
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
  setRequestLocale(await getLocale());

  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = Math.max(1, Number(rawPage) || 1);

  const [categoriesResult, coursesResult, seoResult] = await Promise.allSettled([
    fetchCategories(),
    serverApi.courses.list({ category: params.slug, per_page: PER_PAGE, page }),
    fetchRankMathSeo(`/course-category/${params.slug}`),
  ]);

  const category =
    categoriesResult.status === "fulfilled"
      ? categoriesResult.value.items.find((c) => c.slug === params.slug)
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
  const categoryUrl = rmSeo?.canonical ?? `${siteUrl}/course-cat/${params.slug}`;
  const jsonLd = rmSeo?.jsonLd?.length
    ? rmSeo.jsonLd
    : [
        buildCategorySchema(category, categoryUrl),
        buildBreadcrumbSchema(category.name, siteUrl, categoryUrl),
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
      <CategoryHero category={category} />
      <CategoryCourses
        data={coursesPageData}
        categoryName={category.name}
        categoryDescription={category.description || null}
        currentPage={page}
        basePath={`/course-cat/${params.slug}`}
      />
      <CategoryWhyChooseUs image={category.image} categoryName={category.name} />
    </>
  );
}
