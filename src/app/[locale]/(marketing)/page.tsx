import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { HeroSection } from "@/components/home/hero-section";
import { PricingSection } from "@/components/home/pricing-section";
import { TrustedOrgs } from "@/components/home/trusted-orgs";
import { FeaturedCourses } from "@/components/courses/featured-courses";
import { CategoriesGrid } from "@/components/home/categories-grid";
import { WhySection } from "@/components/home/why-section";
import { ReviewsSection } from "@/components/home/reviews-section";
import { BlogSection } from "@/components/home/blog-section";
import { CourseCardSkeleton } from "@/components/courses/course-card";

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

export default async function HomePage() {
  return (
    <>
      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Pricing */}
      <PricingSection />

      {/* 3. Trusted organizations */}
      <TrustedOrgs />

      {/* 4. Featured courses (8-grid) */}
      <section className="py-16">
        <div className="container">
          <div className="mb-8">
            <h2 className="font-suse text-3xl font-bold text-neutral-900 md:text-4xl">
              Our Most Popular Courses
            </h2>
            <p className="mt-2 font-open-sans text-neutral-500">
              Explore our top-rated courses, trusted by thousands of learners across the UK.
            </p>
          </div>
          <Suspense
            fallback={
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <FeaturedCourses limit={8} />
          </Suspense>

          {/* 5. Browse by category */}
          <CategoriesGrid />
        </div>
      </section>

      {/* 6. Why choose us */}
      <WhySection />

      {/* 7. Reviews */}
      <ReviewsSection />

      {/* 8. Blog */}
      <BlogSection />
    </>
  );
}
