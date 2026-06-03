import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { serverApi } from "@/lib/api/server";
import { normalizeCourse } from "@/lib/services/courses";
import { CategoryHero } from "@/components/courses/category-hero";
import { CategoryCoursesClient } from "@/components/courses/category-courses-client";
import { CategoryWhyChooseUs } from "@/components/courses/category-why-choose-us";
import type { PaginatedResponse } from "@/types/api";
import type { Course } from "@/types/course";

const PER_PAGE = 12;

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
  try {
    const result = await serverApi.taxonomy.categories({ per_page: 100 });
    const category = result.items.find((c) => c.slug === params.slug);
    if (!category) return {};
    return {
      title: `${category.name} Courses | Training Excellence`,
      description:
        category.description ||
        `Browse our accredited ${category.name} online courses. Flexible, CPD-certified training for professionals.`,
      openGraph: {
        title: `${category.name} Courses`,
        description:
          category.description || `Browse our accredited ${category.name} online courses.`,
        images: category.image ? [category.image] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export const revalidate = 300;

export default async function CourseCategoryPage({ params, searchParams }: PageProps) {
  setRequestLocale(params.locale);

  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = Math.max(1, Number(rawPage) || 1);

  const [categoriesResult, coursesResult] = await Promise.all([
    serverApi.taxonomy.categories({ per_page: 100 }).catch(() => null),
    serverApi.courses.list({ category: params.slug, per_page: PER_PAGE, page }).catch(() => null),
  ]);

  const category = categoriesResult?.items?.find((c) => c.slug === params.slug);
  if (!category) notFound();

  const courses: Course[] = (coursesResult?.items ?? []).map((raw) =>
    normalizeCourse(raw as Parameters<typeof normalizeCourse>[0]),
  );

  const initialData: PaginatedResponse<Course> = {
    items: courses,
    total: coursesResult?.total ?? 0,
    totalPages: coursesResult?.totalPages ?? 1,
    page,
    perPage: PER_PAGE,
  };

  return (
    <>
      <CategoryHero category={category} />
      <CategoryCoursesClient
        initialData={initialData}
        categorySlug={params.slug}
        categoryName={category.name}
        categoryDescription={category.description || null}
        perPage={PER_PAGE}
      />
      <CategoryWhyChooseUs image={category.image} categoryName={category.name} />
    </>
  );
}
