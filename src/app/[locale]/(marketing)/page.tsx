import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { serverApi } from "@/lib/api/server";
import { HeroSection } from "@/components/home/hero-section";
import { PricingSection } from "@/components/home/pricing-section";
import { TrustedOrgs } from "@/components/home/trusted-orgs";
import { CategoriesGrid } from "@/components/home/categories-grid";
import { WhySection } from "@/components/home/why-section";
import { ReviewsSection } from "@/components/home/reviews-section";
import { PopularCourses } from "@/components/home/popular-courses";
import { Topbar } from "@/components/home/topbar";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/");
  return buildPageMetadata(seo, {
    title: env.SITE_NAME || "Training Excellence — Online Courses",
    description:
      "Fully accredited online training courses in health & safety, food hygiene, safeguarding, mental health and more. Trusted by thousands across the UK.",
    canonical: env.SITE_URL.replace(/\/$/, ""),
  });
}

const siteUrl = env.SITE_URL.replace(/\/$/, "");

const HOME_SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: env.SITE_NAME || "Training Excellence",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: env.SITE_NAME || "Training Excellence",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${siteUrl}/contact`,
    },
  },
];

export default async function HomePage() {
  const [home, categoriesRes] = await Promise.all([
    serverApi.home.get().catch(() => null),
    serverApi.taxonomy.categories({ per_page: 11 }).catch(() => null),
  ]);

  return (
    <>
      {HOME_SCHEMA.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Topbar items={home?.topbar} />

      <HeroSection headline={home?.hero_headline} />

      <PricingSection data={home?.pricing} />

      <TrustedOrgs sponsors={home?.trusted_orgs} />

      <section className="flex flex-col gap-20 py-16 lg:py-20">
        <PopularCourses limit={8} header={home?.popular_courses_header} />

        <CategoriesGrid categories={categoriesRes?.items} />
      </section>

      <WhySection panels={home?.why} />

      <ReviewsSection testimonials={home?.testimonials} />
    </>
  );
}
