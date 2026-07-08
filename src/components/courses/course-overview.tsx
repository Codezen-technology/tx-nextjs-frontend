import { SafeImage } from "@/components/ui/safe-image";
import { isRenderableImageSrc } from "@/lib/utils/image";
import { publicImageExists } from "@/lib/utils/public-image.server";
import { Star, Users, Wifi } from "lucide-react";
import type { CourseRichData } from "@/types/course";

const TRUST_BADGES = [
  { src: "/images/cpd-logo.png", label: "CPD" },
  { src: "/images/ukrlp-logo.png", label: "UKRLP" },
] as const;

const FEATURES_LEFT = [
  "100% Online Training",
  "Instant Digital Certificate",
  "Printed Certificate Shipped",
  "Full Audio Voiceover",
  "Unlimited Assessment Retakes",
];

const FEATURES_RIGHT = [
  "Written in compliance with UK legislation and guidance",
  "Developed by health and safety professionals",
  "City & Guilds Assured",
  "CPD Accredited & RoSPA Assured",
];

interface CourseOverviewProps {
  course: CourseRichData;
}

export function CourseOverview({ course }: CourseOverviewProps) {
  const primaryAccreditation = course.accreditations?.[0];
  const showFeatured = isRenderableImageSrc(course.featuredImage) && !primaryAccreditation?.logo;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-6">
      {/* Trust + preview image */}
      <div className="w-full shrink-0 lg:w-[306px]">
        <div className="border-neutral-30 overflow-hidden rounded-lg border bg-white p-2">
          {showFeatured ? (
            <div className="bg-neutral-20 relative aspect-290/188 w-full overflow-hidden rounded-md">
              <SafeImage
                src={course.featuredImage!}
                alt=""
                fill
                sizes="306px"
                className="object-cover"
              />
            </div>
          ) : isRenderableImageSrc(primaryAccreditation?.logo) ? (
            <div className="bg-neutral-10 relative flex aspect-290/188 items-center justify-center rounded-md p-4">
              <SafeImage
                src={primaryAccreditation!.logo}
                alt={primaryAccreditation!.label}
                width={160}
                height={80}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="bg-neutral-20 flex aspect-290/188 items-center justify-center rounded-md text-sm text-neutral-500">
              Course preview
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <p className="font-open-sans text-sm leading-snug font-semibold text-neutral-900">
            A Trusted Assessed, Audited and Endorsed Training Provider
          </p>
          <div className="flex gap-4">
            {TRUST_BADGES.map((badge) => (
              <div
                key={badge.src}
                className="border-neutral-30 flex h-14 w-[70px] items-center justify-center rounded border bg-white"
              >
                {publicImageExists(badge.src) ? (
                  <SafeImage
                    src={badge.src}
                    alt={badge.label}
                    width={44}
                    height={44}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-center text-[10px] font-semibold text-neutral-700">
                    {badge.label}
                  </span>
                )}
              </div>
            ))}
            {course.accreditations?.slice(0, 2).map((acc) =>
              isRenderableImageSrc(acc.logo) ? (
                <div
                  key={acc.slug}
                  className="border-neutral-30 relative flex h-14 w-[70px] items-center justify-center rounded border bg-white p-1"
                >
                  <SafeImage
                    src={acc.logo}
                    alt={acc.label}
                    width={44}
                    height={44}
                    className="object-contain"
                  />
                </div>
              ) : null,
            )}
          </div>
        </div>
      </div>

      {/* Title + rating + features */}
      <div className="min-w-0 flex-1">
        <h1 className="font-suse text-2xl leading-tight font-bold text-neutral-900 sm:text-[29px]">
          {course.title}
        </h1>

        {course.rating !== undefined ? (
          <div className="font-open-sans mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-neutral-700">
            <span className="font-semibold text-neutral-900">{course.rating.toFixed(1)}</span>
            <span className="flex gap-0.5" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(course.rating!) ? "fill-amber-400 text-amber-400" : "text-neutral-30"}`}
                />
              ))}
            </span>
            {course.ratingCount ? (
              <span className="text-neutral-600">
                ({course.ratingCount.toLocaleString()} ratings)
              </span>
            ) : null}
            {course.studentsCount ? (
              <span className="flex items-center gap-1 text-neutral-600">
                <Users className="h-4 w-4" />
                {course.studentsCount.toLocaleString()} Students
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <ul className="space-y-4">
            {FEATURES_LEFT.map((feat) => (
              <li
                key={feat}
                className="font-open-sans flex items-start gap-2 text-base text-neutral-800"
              >
                <Wifi className="text-primary-500 mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                {feat}
              </li>
            ))}
          </ul>
          <ul className="space-y-4">
            {FEATURES_RIGHT.map((feat) => (
              <li
                key={feat}
                className="font-open-sans flex items-start gap-2 text-base text-neutral-800"
              >
                <Wifi className="text-primary-500 mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                {feat}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
