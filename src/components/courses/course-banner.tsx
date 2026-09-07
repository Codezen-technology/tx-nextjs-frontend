import { SafeImage } from "@/components/ui/safe-image";
import { HeroWave } from "@/components/courses/hero-wave";
import { isRenderableImageSrc } from "@/lib/utils/image";
import { publicImageExists } from "@/lib/utils/public-image.server";
import { cn } from "@/lib/utils/cn";
import { Star, Wifi } from "lucide-react";
import type { CourseRichData } from "@/types/course";

const TRUST_BADGES = [
  { src: "/images/cpd-logo.png", label: "CPD" },
  { src: "/images/ukrlp-logo.png", label: "UKRLP" },
  { src: "/images/disability.png", label: "Disability" },
  { src: "/images/aoht.png", label: "AOHT" },
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
const BANNER_OVERLAY_GRADIENT = "linear-gradient(88deg, #00204A 0%, #004F65 100.15%)";

interface CourseBannerProps {
  src?: string | null;
  alt: string;
  course?: CourseRichData;
}

export function CourseBanner({ src, alt, course }: CourseBannerProps) {
  const hasImage = isRenderableImageSrc(src);

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
      className={cn("relative w-full", !course && "h-70 sm:h-95 lg:h-120")}
      aria-label="Course banner"
    >
      {/*
        Full-bleed backdrop. The banner sits inside the centred page grid (the purchase
        card overlays its top-right, Figma 6239:163263), so the navy tint and wave have to
        break out of the container to reach the viewport edges.

        KNOWN EXCEPTION to the page-grid rule in globals.css, which rejects `100vw`
        because it includes the scrollbar and `container`'s centring does not. A box that
        is viewport-wide *and* exactly one row of a centred grid tall cannot be expressed
        without a viewport unit — removing this means restructuring the page onto a
        full-width grid, which is openspec/changes/course-page-grid-compliance.

        The half-scrollbar overhang that rule warns about is contained by `overflow-x-clip`
        on the page root — `clip`, not `hidden`, which would break the card's sticky.
      */}
      <div
        className="absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 overflow-hidden"
        aria-hidden
      >
        {/* Brand tint — Figma 256:11794 */}
        <div className="absolute inset-0" style={{ background: BANNER_OVERLAY_GRADIENT }} />

        {/* Decorative wave + pattern — Figma 256:11795–11797 */}
        <HeroWave />
      </div>

      {/* Course overview — Figma 256:11832.
          `lg:pr-*` reserves the 307px purchase-card column + 24px gap that the page grid
          overlays on top of this row (Figma 6239:163263 sits at the hero's top-right). */}
      {course && (
        <div className="relative z-10 pt-10 pb-20 lg:pt-14 lg:pr-[331px] lg:pb-24">
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
            {/* Left col: thumbnail + trust — desktop only */}
            <div className="hidden w-76.5 shrink-0 space-y-4 lg:block">
              <div className="overflow-hidden border border-white/20 bg-white p-2">
                {hasImage ? (
                  <div className="relative aspect-290/188 w-full overflow-hidden bg-neutral-900">
                    <SafeImage src={src!} alt="" fill sizes="306px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex aspect-290/188 items-center justify-center rounded-md bg-neutral-800 text-sm text-white/60">
                    Course preview
                  </div>
                )}
              </div>

              {updatedLabel ? (
                <p className="font-open-sans text-xs text-white/80">
                  Last updated: <span className="font-semibold text-white">{updatedLabel}</span>
                </p>
              ) : (
                <p className="font-open-sans text-xs leading-snug font-semibold text-white">
                  A Trusted Assessed, Audited and Endorsed Training Provider
                </p>
              )}

              <div className="flex gap-2">
                {TRUST_BADGES.map((badge) => (
                  <div
                    key={badge.src}
                    className="flex h-14 w-17.5 items-center justify-center rounded border border-white/20 bg-white"
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
              </div>
            </div>

            {/* Right col: title + rating + features */}
            <div className="min-w-0 flex-1">
              <h1 className="font-suse text-2xl leading-tight font-bold text-white sm:text-[29px]">
                {course.title}
              </h1>

              {course.rating || course.studentsCount ? (
                <div className="font-open-sans mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-base">
                  {course.rating ? (
                    <>
                      <span className="font-bold text-amber-400">{course.rating.toFixed(1)}</span>
                      <span className="flex gap-0.5" aria-hidden>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-4 w-4",
                              i < Math.round(course.rating ?? 0)
                                ? "fill-[#FFC107] text-[#FFC107]"
                                : "text-white/30",
                            )}
                          />
                        ))}
                      </span>
                    </>
                  ) : null}
                  {course.ratingCount ? (
                    <span className="text-secondary-100 underline">
                      ({course.ratingCount.toLocaleString()} ratings)
                    </span>
                  ) : null}
                  {course.studentsCount ? (
                    <span className="flex items-center gap-1 text-white">
                      {course.studentsCount.toLocaleString()} Students
                    </span>
                  ) : null}
                </div>
              ) : null}

              {/* Features grid — desktop only */}
              <div className="mt-6 hidden lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-3">
                <ul className="space-y-3">
                  {FEATURES_LEFT.map((feat) => (
                    <li
                      key={feat}
                      className="font-open-sans flex items-start gap-2 text-base text-neutral-50"
                    >
                      <Wifi className="text-primary-500 mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                      {feat}
                    </li>
                  ))}
                </ul>
                <ul className="space-y-3">
                  {FEATURES_RIGHT.map((feat) => (
                    <li
                      key={feat}
                      className="font-open-sans flex items-start gap-2 text-base text-neutral-50"
                    >
                      <Wifi className="text-primary-500 mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
