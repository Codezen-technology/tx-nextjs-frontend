import { SafeImage } from "@/components/ui/safe-image";
import { isRenderableImageSrc } from "@/lib/utils/image";

/** Figma node 256:11794 — Rectangle 9 overlay on course banner */
const BANNER_OVERLAY_GRADIENT =
  "linear-gradient(83.86deg, rgba(0, 32, 74, 0.8) 0%, rgba(0, 79, 101, 0.8) 100.15%)";

interface CourseBannerProps {
  src?: string | null;
  alt: string;
}

export function CourseBanner({ src, alt }: CourseBannerProps) {
  const hasImage = isRenderableImageSrc(src);

  return (
    <section
      className="relative h-[280px] w-full overflow-hidden sm:h-[380px] lg:h-[480px]"
      aria-label="Course banner"
    >
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
        <div className="absolute inset-0 bg-neutral-900" aria-hidden />
      )}

      {/* Brand tint — always on top of photo (Figma Frame 7 / Rectangle 9) */}
      <div
        className="absolute inset-0"
        style={{ background: BANNER_OVERLAY_GRADIENT }}
        aria-hidden
      />

      {/* Decorative wave + pattern (Figma 256:11795–11797), fill secondary-50 #F5F1E9 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden sm:h-20">
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
