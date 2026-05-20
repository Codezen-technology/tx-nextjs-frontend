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
import { CourseOverview } from "@/components/courses/course-overview";
import { CoursePurchaseCard } from "@/components/courses/course-purchase-card";
import { CourseWhatYouLearn } from "@/components/courses/course-what-you-learn";
import { CourseAbout } from "@/components/courses/course-about";
import { CourseTabs } from "@/components/courses/course-tabs";
import { CourseScreenshots } from "@/components/courses/course-screenshots";
import { CourseExperts } from "@/components/courses/course-experts";
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

      {course.announcement ? (
        <CourseAnnouncement message={course.announcement} />
      ) : null}

      <CourseBanner src={course.featuredImage} alt={course.title} />

      <div className="container mx-auto max-w-[1296px] px-4 pb-16">
        <div className="-mt-10 flex flex-col gap-8 lg:-mt-16 lg:flex-row lg:items-start lg:gap-6">
          <div className="min-w-0 flex-1 space-y-10 lg:max-w-[966px]">
            <CourseOverview course={course} />

            <div className="space-y-10 lg:hidden">
              <CoursePurchaseCard course={course} />
            </div>

            {(whatYouLearn.length > 0 || sections?.at_a_glance) && (
              <div className="space-y-10">
                {whatYouLearn.length > 0 ? (
                  <CourseWhatYouLearn items={whatYouLearn} />
                ) : null}
                {sections?.at_a_glance ? (
                  <CourseAbout
                    heading={sections.description_heading}
                    html={sections.at_a_glance}
                  />
                ) : null}
              </div>
            )}

            <CourseTabs
              courseId={course.id}
              accreditations={accreditations}
              curriculum={curriculum}
              sections={sections}
            />

            {screenshots.length > 0 ? (
              <CourseScreenshots screenshots={screenshots} />
            ) : null}

            {experts.length > 0 ? <CourseExperts experts={experts} /> : null}

            <CourseRelated courseId={course.id} />
          </div>

          <aside className="hidden shrink-0 lg:block lg:w-[307px]">
            <div className="sticky top-24">
              <CoursePurchaseCard course={course} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
