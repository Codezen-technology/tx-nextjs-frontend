import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { wpPath } from "@/lib/seo/wp-paths";
import { env } from "@/lib/env";
import { serverApi } from "@/lib/api/server";
import { HeroSection } from "@/components/home/hero-section";
import { PricingSection } from "@/components/home/pricing-section";
import { TrustedOrgs } from "@/components/home/trusted-orgs";
import { CategoriesGrid } from "@/components/home/categories-grid";
import { WhyChooseGrid } from "@/components/home/why-choose-grid";
import { TransformTeam } from "@/components/home/transform-team";
import { CpdCertificate } from "@/components/home/cpd-certificate";
import { ReviewsSection } from "@/components/home/reviews-section";
import { PopularCourses } from "@/components/home/popular-courses";
import { Topbar } from "@/components/home/topbar";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  try {
    setRequestLocale(await getLocale());
    const seo = await fetchRankMathSeo(wpPath.home());
    return buildPageMetadata(seo, {
      title: env.SITE_NAME || "Training Excellence — Online Courses",
      description:
        "Fully accredited online training courses in health & safety, food hygiene, safeguarding, mental health and more. Trusted by thousands across the UK.",
      canonical: env.SITE_URL.replace(/\/$/, ""),
    });
  } catch (error) {
    return {
      title: env.SITE_NAME || "Training Excellence — Online Courses",
      description:
        "Fully accredited online training courses in health & safety, food hygiene, safeguarding, mental health and more. Trusted by thousands across the UK.",
    };
  }
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
      url: `${siteUrl}/contact-us`,
    },
  },
];

export default async function HomePage() {
  const [home, categoriesRes] = await Promise.all([
    serverApi.home.get().catch(() => null),
    serverApi.taxonomy.categories({ per_page: 12 }).catch(() => null),
  ]);
  return (
    <>
      {HOME_SCHEMA.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(schema) }}
        />
      ))}
      <Topbar items={home?.topbar} />

      <HeroSection headline={home?.hero_headline} />

      <TrustedOrgs data={home?.trusted_orgs} />

      <section className="flex flex-col gap-20 py-16 lg:py-20">
        <CategoriesGrid categories={categoriesRes?.items} />

        <PopularCourses limit={8} header={home?.popular_courses_header} />
      </section>

      <ReviewsSection testimonials={home?.testimonials} />

      <PricingSection data={home?.pricing} />

      <WhyChooseGrid features={home?.why} />

      <TransformTeam data={home?.team} />

      <CpdCertificate data={home?.certificate} />
    </>
  );
}
