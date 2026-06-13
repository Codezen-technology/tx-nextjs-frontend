import { SafeImage } from "@/components/ui/safe-image";
import { isRenderableImageSrc } from "@/lib/utils/image";
import { publicImageExists } from "@/lib/utils/public-image.server";
import { cn } from "@/lib/utils/cn";
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

/** Figma node 256:11794 — Rectangle 9 overlay on course banner */
const BANNER_OVERLAY_GRADIENT =
  "linear-gradient(83.86deg, rgba(0, 32, 74, 0.8) 0%, rgba(0, 79, 101, 0.8) 100.15%)";

interface CourseBannerProps {
  src?: string | null;
  alt: string;
  course?: CourseRichData;
}

export function CourseBanner({ src, alt, course }: CourseBannerProps) {
  const hasImage = isRenderableImageSrc(src);
  const primaryAccreditation = course?.accreditations?.[0];
  const showFeatured = hasImage && !isRenderableImageSrc(primaryAccreditation?.logo);

  const updatedLabel = (() => {
    if (!course?.updatedAt) return null;
    try {
      return new Date(course.updatedAt).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return null;
    }
  })();

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden",
        !course && "h-[280px] sm:h-[380px] lg:h-[480px]",
      )}
      aria-label="Course banner"
    >
      {/* Background: featured image */}
      <div className="absolute inset-0">
        {hasImage ? (
          <SafeImage
            src={src!}
            alt={alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-[#00204a]" aria-hidden />
        )}
      </div>

      {/* Brand tint — Figma 256:11794 */}
      <div
        className="absolute inset-0"
        style={{ background: BANNER_OVERLAY_GRADIENT }}
        aria-hidden
      />

      {/* Course overview — Figma 256:11832 */}
      {course && (
        <div className="relative z-10 mx-auto max-w-[1296px] px-4 pb-20 pt-10 lg:pb-24 lg:pt-14">
          <div className="flex flex-col gap-6 lg:max-w-[966px] lg:flex-row lg:gap-6">
            {/* Left col: thumbnail + trust — desktop only */}
            <div className="hidden w-[306px] shrink-0 space-y-4 lg:block">
              <div className="overflow-hidden rounded-lg border border-white/20 bg-white p-2">
                {showFeatured ? (
                  <div className="relative aspect-[290/188] w-full overflow-hidden rounded-md bg-neutral-900">
                    <SafeImage src={src!} alt="" fill sizes="306px" className="object-cover" />
                  </div>
                ) : isRenderableImageSrc(primaryAccreditation?.logo) ? (
                  <div className="relative flex aspect-[290/188] items-center justify-center rounded-md bg-white p-4">
                    <SafeImage
                      src={primaryAccreditation!.logo}
                      alt={primaryAccreditation!.label}
                      width={160}
                      height={80}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[290/188] items-center justify-center rounded-md bg-neutral-800 text-sm text-white/60">
                    Course preview
                  </div>
                )}
              </div>

              {updatedLabel ? (
                <p className="font-open-sans text-xs text-white/80">
                  Last updated: <span className="font-semibold text-white">{updatedLabel}</span>
                </p>
              ) : (
                <p className="font-open-sans text-xs font-semibold leading-snug text-white">
                  A Trusted Assessed, Audited and Endorsed Training Provider
                </p>
              )}

              <div className="flex gap-3">
                {TRUST_BADGES.map((badge) => (
                  <div
                    key={badge.src}
                    className="flex h-[56px] w-[70px] items-center justify-center rounded border border-white/20 bg-white"
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
                      className="flex h-[56px] w-[70px] items-center justify-center rounded border border-white/20 bg-white p-1"
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

            {/* Right col: title + rating + features */}
            <div className="min-w-0 flex-1">
              <h1 className="font-suse text-2xl font-bold leading-tight text-white sm:text-[29px]">
                {course.title}
              </h1>

              {course.rating !== undefined && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-open-sans text-base">
                  <span className="font-bold text-amber-400">{course.rating.toFixed(1)}</span>
                  <span className="flex gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < Math.round(course.rating!)
                            ? "fill-amber-400 text-amber-400"
                            : "text-white/30",
                        )}
                      />
                    ))}
                  </span>
                  {course.ratingCount ? (
                    <span className="text-[#e1d2ba] underline">
                      ({course.ratingCount.toLocaleString()} ratings)
                    </span>
                  ) : null}
                  {course.studentsCount ? (
                    <span className="flex items-center gap-1 text-white">
                      <Users className="h-4 w-4" aria-hidden />
                      {course.studentsCount.toLocaleString()} Students
                    </span>
                  ) : null}
                </div>
              )}

              {/* Features grid — desktop only */}
              <div className="mt-6 hidden lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-3">
                <ul className="space-y-3">
                  {FEATURES_LEFT.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2 font-open-sans text-base text-[#bfc7d2]"
                    >
                      <Wifi className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" aria-hidden />
                      {feat}
                    </li>
                  ))}
                </ul>
                <ul className="space-y-3">
                  {FEATURES_RIGHT.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2 font-open-sans text-base text-[#bfc7d2]"
                    >
                      <Wifi className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" aria-hidden />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decorative wave + pattern — Figma 256:11795–11797 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden opacity-10 sm:h-20">
        <div className="absolute left-1/2 top-0 flex h-[405.89px] w-[max(100%,1920px)] -translate-x-1/2 items-center justify-center">
          <div className="shrink-0 -rotate-90">
            <img
              src="/images/course-banner-wave.svg"
              alt=""
              width={406}
              height={1920}
              decoding="async"
              className="block h-[1920px] w-[405.89px] max-w-none"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  );
}
