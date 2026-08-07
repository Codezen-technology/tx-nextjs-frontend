import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, setRequestLocale } from "next-intl/server";
import { serverApi } from "@/lib/api/server";
import { normalizeRichCourse } from "@/lib/services/courses";
import { truncate, stripHtml } from "@/lib/utils/format";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { wpPath } from "@/lib/seo/wp-paths";
import { env } from "@/lib/env";
import { CourseAnnouncement } from "@/components/courses/course-announcement";
import { CourseBreadcrumb } from "@/components/courses/course-breadcrumb";
import { CourseTrustedStrip } from "@/components/courses/course-trusted-strip";
import { CourseBanner } from "@/components/courses/course-banner";
import { CoursePurchaseCard } from "@/components/courses/course-purchase-card";
import { CourseWhatYouLearn } from "@/components/courses/course-what-you-learn";
import { CourseAbout } from "@/components/courses/course-about";
import { CourseTabNav } from "@/components/courses/course-tab-nav";
import { CourseAccreditations } from "@/components/courses/course-accreditations";
import { CourseScreenshots } from "@/components/courses/course-screenshots";
import { CourseExperts } from "@/components/courses/course-experts";
import { CourseFlatCurriculum } from "@/components/courses/course-flat-curriculum";
import { CourseFaq } from "@/components/courses/course-faq";
import { CourseReviews } from "@/components/courses/course-reviews";
import { CourseSuitableFor } from "@/components/courses/course-suitable-for";
import { CourseWhyTake } from "@/components/courses/course-why-take";
import { CourseRequirements } from "@/components/courses/course-requirements";
import { CourseAssessment } from "@/components/courses/course-assessment";
import { CourseJobOpportunities } from "@/components/courses/course-job-opportunities";
import { CourseRelated } from "@/components/courses/course-related";
import type { CourseRichData } from "@/types/course";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  try {
    const data = await serverApi.courses.list({ per_page: 500 });
    const items = Array.isArray(data)
      ? data
      : ((data as { items?: { slug: string }[] }).items ?? []);
    return (items as { slug: string }[]).flatMap(({ slug }) => (slug ? [{ slug }] : []));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  setRequestLocale(await getLocale());
  try {
    const [raw, seo] = await Promise.all([
      serverApi.courses.richDetail(slug),
      fetchRankMathSeo(wpPath.course(slug)),
    ]);
    const course = normalizeRichCourse(raw);
    const siteUrl = env.SITE_URL.replace(/\/$/, "");
    return buildPageMetadata(seo, {
      title: course.title,
      description: truncate(stripHtml(course.excerpt ?? course.content), 160),
      image: course.featuredImage,
      canonical: `${siteUrl}/course/${slug}`,
    });
  } catch {
    const siteUrl = env.SITE_URL.replace(/\/$/, "");
    return {
      title: "Online Training Course | Training Excellence",
      description:
        "Professional online training courses. Instant digital certificate on completion.",
      alternates: { canonical: `${siteUrl}/course/${slug}` },
    };
  }
}

function buildCourseSchema(course: CourseRichData, url: string): Record<string, unknown> {
  const org = {
    "@type": "Organization",
    name: env.SITE_NAME || "Training Excellence",
    url: env.SITE_URL,
  };

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: truncate(stripHtml(course.excerpt ?? course.content ?? ""), 300),
    url,
    provider: org,
    // Required by Google (May 2023) for Course rich results
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: "Self-paced",
      instructor: org,
    },
  };

  if (course.featuredImage) schema.image = course.featuredImage;

  if (course.price != null) {
    schema.offers = {
      "@type": "Offer",
      price: course.price,
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
      url,
    };
  }

  if (course.rating != null && course.ratingCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: course.rating,
      reviewCount: course.ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

function buildBreadcrumbSchema(course: CourseRichData, siteUrl: string): Record<string, unknown> {
  const items: { name: string; url: string }[] = [
    { name: "Home", url: siteUrl },
    { name: "Courses", url: `${siteUrl}/all-courses` },
    ...(course.breadcrumb ?? []).map((crumb) => ({
      name: crumb.name,
      url: `${siteUrl}/course-cat/${crumb.slug}`,
    })),
    { name: course.title, url: `${siteUrl}/course/${course.slug}` },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  setRequestLocale(await getLocale());

  const [courseResult, sectionsResult, curriculumResult, seoResult] = await Promise.allSettled([
    serverApi.courses.richDetail(slug),
    serverApi.courses.sections(slug),
    serverApi.courses.curriculum(slug),
    fetchRankMathSeo(wpPath.course(slug)),
  ]);

  if (courseResult.status === "rejected") notFound();
  const course = normalizeRichCourse(courseResult.value);
  const sections = sectionsResult.status === "fulfilled" ? sectionsResult.value : null;
  const curriculum = curriculumResult.status === "fulfilled" ? (curriculumResult.value ?? []) : [];
  const rmSeo = seoResult.status === "fulfilled" ? seoResult.value : null;

  const accreditations = course.accreditations ?? [];
  const experts = course.experts ?? [];
  const screenshots = sections?.screenshots ?? [];
  const whatYouLearn = sections?.what_you_will_learn ?? null;

  const siteUrl = env.SITE_URL.replace(/\/$/, "");
  // Prefer canonical from Rank Math so JSON-LD url matches the canonical tag exactly
  const courseUrl = rmSeo?.canonical ?? `${siteUrl}/course/${course.slug}`;
  // RankMath provides Course + BreadcrumbList schemas when configured.
  // Fallback: emit both manually so Google always has structured data.
  const jsonLd = rmSeo?.jsonLd?.length
    ? rmSeo.jsonLd
    : [buildCourseSchema(course, courseUrl), buildBreadcrumbSchema(course, siteUrl)];

  return (
    <div className="min-h-screen bg-white">
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(schema) }}
        />
      ))}
      <CourseBreadcrumb course={course} />
      <CourseTrustedStrip />

      {course.announcement ? <CourseAnnouncement message={course.announcement} /> : null}

      <CourseBanner src={course.featuredImage} alt={course.title} course={course} />

      <div className="mx-auto max-w-[1296px] px-4 pb-20">
        {/* Two-column layout: 966px main + 307px sticky sidebar */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* ── Main column ── */}
          <div className="min-w-0 flex-1 lg:max-w-[966px]">
            {/* Purchase card — mobile only */}
            <div className="mt-6 lg:hidden">
              <CoursePurchaseCard course={course} />
            </div>

            {/* ── What you'll learn + About ── */}
            {whatYouLearn || sections?.at_a_glance ? (
              <div className="mt-10 space-y-10">
                {whatYouLearn ? <CourseWhatYouLearn html={whatYouLearn} /> : null}
                {sections?.at_a_glance ? (
                  <CourseAbout heading={sections.description_heading} html={sections.at_a_glance} />
                ) : null}
              </div>
            ) : null}

            {/* ── Sticky anchor tabs ── */}
            <CourseTabNav
              accreditations={accreditations}
              curriculum={curriculum}
              hasScreenshots={screenshots.length > 0}
              hasReviews={!!course.ratingCount}
              sections={sections}
              courseId={course.id}
            />

            {/* ── Accreditations ── */}
            {accreditations.length > 0 ? (
              <section id="accreditations" className="mt-12 scroll-mt-28">
                <CourseAccreditations accreditations={accreditations} />
              </section>
            ) : null}

            {/* ── Course in action (screenshots) ── */}
            {screenshots.length > 0 ? (
              <section id="course-content" className="mt-16 scroll-mt-28">
                <CourseScreenshots screenshots={screenshots} />
              </section>
            ) : null}

            {/* ── Empower and Engage (experts) ── */}
            {experts.length > 0 ? (
              <section className="mt-16">
                <CourseExperts experts={experts} />
              </section>
            ) : null}

            {/* ── Curriculum ── */}
            {curriculum.length > 0 ? (
              <section id="curriculum" className="mt-16 scroll-mt-28">
                <CourseFlatCurriculum items={curriculum} />
              </section>
            ) : null}

            {/* ── Why take ── */}
            {sections?.why_take ? (
              <div className="mt-16">
                <CourseWhyTake html={sections.why_take} />
              </div>
            ) : null}

            {/* ── Requirements ── */}
            {sections?.requirements ? (
              <div className="mt-16">
                <CourseRequirements html={sections.requirements} />
              </div>
            ) : null}

            {/* ── Assessment ── */}
            {sections?.assessment ? (
              <div className="mt-16">
                <CourseAssessment html={sections.assessment} />
              </div>
            ) : null}

            {/* ── Suitable for ── */}
            {sections?.who_should_take?.items?.length ? (
              <section id="suitable-for" className="mt-16 scroll-mt-28">
                <CourseSuitableFor
                  heading={sections.who_should_take.summary}
                  items={sections.who_should_take.items}
                />
              </section>
            ) : null}

            {/* ── Job Opportunities ── */}
            {sections?.job_opportunities?.items?.length ? (
              <section id="job-opportunities" className="mt-16 scroll-mt-28">
                <CourseJobOpportunities
                  heading={sections.job_opportunities.heading}
                  items={sections.job_opportunities.items}
                />
              </section>
            ) : null}

            {/* ── FAQ ── */}
            {sections?.faq?.length ? (
              <section id="faq" className="mt-16 scroll-mt-28">
                <CourseFaq heading={sections.faq_heading} items={sections.faq} />
              </section>
            ) : null}

            {/* ── Reviews ── */}
            {course.ratingCount ? (
              <section id="reviews" className="mt-16 scroll-mt-28">
                <CourseReviews courseId={course.id} />
              </section>
            ) : null}

            {/* ── Related courses ── */}
            <div className="mt-16">
              <CourseRelated courseId={course.id} />
            </div>
          </div>

          {/* ── Desktop sticky sidebar ── */}
          <aside className="hidden shrink-0 lg:mt-[-428px] lg:block lg:w-[307px] lg:self-stretch">
            <div className="sticky top-24 z-20">
              <CoursePurchaseCard course={course} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
