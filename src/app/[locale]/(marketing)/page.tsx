import { Suspense } from "react";
import { HeroSection } from "@/components/home/hero-section";
import { PricingSection } from "@/components/home/pricing-section";
import { TrustedOrgs } from "@/components/home/trusted-orgs";
import { FeaturedCourses } from "@/components/courses/featured-courses";
import { CategoriesGrid } from "@/components/home/categories-grid";
import { WhySection } from "@/components/home/why-section";
import { ReviewsSection } from "@/components/home/reviews-section";
import { BlogSection } from "@/components/home/blog-section";
import { CourseCardSkeleton } from "@/components/courses/course-card";
import { PopularCourses } from "@/components/home/popular-courses";
import { Topbar } from "@/components/home/topbar";

export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      {/* 0. Topbar */}
      <Topbar />

      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Pricing */}
      <PricingSection />

      {/* 3. Trusted organizations */}
      <TrustedOrgs />

      {/* 4. Featured courses (8-grid) */}
      {/* <section className="pt-20">
        <div className="container">
          <div className="mb-8">
            <h2 className="font-suse text-3xl font-bold text-neutral-900 md:text-4xl">
              Popular Courses
            </h2>
            <p className="mt-2 font-open-sans text-neutral-500">
              Explore our wide range of online courses covering key areas like Health & Safety, Compliance, Education, Food Hygiene, Safeguarding, and more. Whether you're looking to advance your personal skills or provide your team or business with the knowledge they need, our courses are designed to foster growth, safety, and compliance in any workplace.
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

          
        </div>
      </section> */}

      <section className="flex flex-col gap-20 py-16 lg:py-20">
        {/* 4. Popular Courses */}
        <PopularCourses limit={8} />

        {/* 5. Browse by category */}
        <CategoriesGrid />
      </section>

      {/* 6. Why choose us */}
      <WhySection />

      {/* 7. Reviews */}
      <ReviewsSection />

      {/* 8. Blog */}
      {/* <BlogSection /> */}
    </>
  );
}
