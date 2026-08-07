import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { wpPath } from "@/lib/seo/wp-paths";
import { env } from "@/lib/env";
import { serverApi } from "@/lib/api/server";
import { normalizeCourse } from "@/lib/services/courses";
import { AllCoursesHero } from "@/components/courses/all-courses-hero";
import { AllCoursesClient } from "@/components/courses/all-courses-client";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo(wpPath.page("all-courses"));
  return buildPageMetadata(seo, {
    title: "All Online Courses",
    description:
      "Browse our full range of fully accredited online courses across health & safety, food hygiene, safeguarding, mental health, and more. Instant digital certificate on completion.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/all-courses`,
  });
}

const ALL_COURSES_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "All Online Courses",
  description: "Browse the full Training Excellence catalogue of accredited online courses.",
  url: `${env.SITE_URL.replace(/\/$/, "")}/all-courses`,
  isPartOf: {
    "@type": "WebSite",
    name: "Training Excellence",
    url: env.SITE_URL,
  },
};

export default async function AllCoursesPage() {
  const result = await serverApi.taxonomy.categories({ per_page: 100 }).catch(() => null);
  const categories = result?.items?.filter((c) => c.count > 0) ?? [];

  const categoryData = await Promise.all(
    categories.map(async (category) => {
      const res = await serverApi.courses
        .list({ category: category.slug, per_page: 6 })
        .catch(() => null);
      const courses = (res?.items ?? []).map((raw) =>
        normalizeCourse(raw as Parameters<typeof normalizeCourse>[0]),
      );
      return { category, courses };
    }),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(ALL_COURSES_SCHEMA) }}
      />
      <AllCoursesHero />
      <AllCoursesClient categoryData={categoryData.filter((d) => d.courses.length > 0)} />
    </>
  );
}
