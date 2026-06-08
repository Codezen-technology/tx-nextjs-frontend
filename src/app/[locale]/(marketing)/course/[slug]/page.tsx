import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, setRequestLocale } from "next-intl/server";
import { serverApi } from "@/lib/api/server";
import { normalizeRichCourse } from "@/lib/services/courses";
import { truncate, stripHtml } from "@/lib/utils/format";
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
import { CourseRelated } from "@/components/courses/course-related";
import type { CourseFlatCurriculumItem, CourseSections } from "@/types/course";

interface PageProps {
  params: { locale: string; slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  setRequestLocale(await getLocale());
  try {
    const raw = await serverApi.courses.richDetail(params.slug);
    const course = normalizeRichCourse(raw);
    const description = truncate(stripHtml(course.excerpt ?? course.content), 160);
    return {
      title: course.title,
      description,
      openGraph: {
        title: course.title,
        description,
        images: course.featuredImage ? [course.featuredImage] : undefined,
      },
    };
  } catch {
    return { title: "Course" };
  }
}

export default async function CourseDetailPage({ params }: PageProps) {
  setRequestLocale(await getLocale());
  let rawCourse: Record<string, unknown>;

  try {
    rawCourse = await serverApi.courses.richDetail(params.slug);
  } catch {
    notFound();
  }

  const course = normalizeRichCourse(rawCourse!);

  let sections: CourseSections | null = null;
  let curriculum: CourseFlatCurriculumItem[] = [];

  const [sectionsResult, curriculumResult] = await Promise.allSettled([
    serverApi.courses.sections(params.slug),
    serverApi.courses.curriculum(params.slug),
  ]);

  if (sectionsResult.status === "fulfilled") {
    sections = sectionsResult.value;
  }
  if (curriculumResult.status === "fulfilled") {
    curriculum = (curriculumResult.value ?? []) as CourseFlatCurriculumItem[];
  }

  const accreditations = course.accreditations ?? [];
  const experts = course.experts ?? [];
  const screenshots = sections?.screenshots ?? [];
  const whatYouLearn = sections?.what_you_will_learn ?? [];

  return (
    <div className="min-h-screen bg-white">
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
            {whatYouLearn.length > 0 || sections?.at_a_glance ? (
              <div className="mt-10 space-y-10">
                {whatYouLearn.length > 0 ? <CourseWhatYouLearn items={whatYouLearn} /> : null}
                {sections?.at_a_glance ? (
                  <CourseAbout heading={sections.description_heading} html={sections.at_a_glance} />
                ) : null}
              </div>
            ) : null}

            {/* ── Sticky anchor tabs ── */}
            <CourseTabNav
              accreditations={accreditations}
              curriculum={curriculum}
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
              <section
                id={screenshots.length === 0 ? "course-content" : "curriculum"}
                className="mt-16 scroll-mt-28"
              >
                <CourseFlatCurriculum items={curriculum} />
              </section>
            ) : null}

            {/* ── FAQ ── */}
            {sections?.faq?.length ? (
              <section id="faq" className="mt-16 scroll-mt-28">
                <CourseFaq heading={sections.faq_heading} items={sections.faq} />
              </section>
            ) : null}

            {/* ── Reviews ── */}
            <section id="reviews" className="mt-16 scroll-mt-28">
              <CourseReviews courseId={course.id} />
            </section>

            {/* ── Suitable for ── */}
            {sections?.who_should_take?.items?.length ? (
              <section id="suitable-for" className="mt-16 scroll-mt-28">
                <CourseSuitableFor
                  heading={sections.who_should_take.summary}
                  items={sections.who_should_take.items}
                />
              </section>
            ) : null}

            {/* ── Related courses ── */}
            <div className="mt-16">
              <CourseRelated courseId={course.id} />
            </div>
          </div>

          {/* ── Desktop sticky sidebar — z-20 so it sits above banner's z-10 overlay ── */}
          <aside className="relative z-20 hidden shrink-0 lg:-mt-[428px] lg:block lg:w-[307px]">
            <div className="sticky top-24">
              <CoursePurchaseCard course={course} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
