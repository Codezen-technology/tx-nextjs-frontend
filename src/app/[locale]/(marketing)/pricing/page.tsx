import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { serverApi } from "@/lib/api/server";
import { Topbar } from "@/components/home/topbar";
import { PricingHero } from "@/components/home/pricing-hero";
import { PricingSection } from "@/components/home/pricing-section";
import { Accreditations } from "@/components/home/accreditations";
import { PricingComparison } from "@/components/home/pricing-comparison";
import { TrustedOrgs } from "@/components/home/trusted-orgs";
import { ReviewsSection } from "@/components/home/reviews-section";
import { CategoriesGrid } from "@/components/home/categories-grid";
import { CourseFaq } from "@/components/courses/course-faq";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/pricing");
  return buildPageMetadata(seo, {
    title: "Pricing — Training Excellence",
    description:
      "Flexible membership plans for unlimited access to hundreds of accredited online courses. Compare plans and start learning today.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/pricing`,
  });
}

export default async function PricingPage() {
  const [pricing, home, categoriesRes] = await Promise.all([
    serverApi.pricing.get().catch(() => null),
    serverApi.home.get().catch(() => null),
    serverApi.taxonomy.categories({ per_page: 12 }).catch(() => null),
  ]);

  return (
    <>
      <Topbar items={home?.topbar} />

      <PricingHero />

      <PricingSection data={pricing?.pricing} />

      <Accreditations />

      <TrustedOrgs data={home?.trusted_orgs} />

      <ReviewsSection testimonials={home?.testimonials} />

      <PricingComparison plans={pricing?.pricing?.plans} />

      <section className="bg-white py-16 lg:py-20">
        <div className="container mx-auto">
          <CategoriesGrid categories={categoriesRes?.items} />
        </div>
      </section>

      {pricing?.faq?.length ? (
        <section className="bg-white py-20">
          <div className="container mx-auto max-w-4xl">
            <CourseFaq items={pricing.faq} />
          </div>
        </section>
      ) : null}
    </>
  );
}
