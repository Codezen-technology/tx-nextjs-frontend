"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { isRenderableImageSrc } from "@/lib/utils/image";
import { cn } from "@/lib/utils/cn";

interface CourseScreenshotsProps {
  screenshots: string[];
  /** Overlay caption on the first slide — `sneak_peek_text` from the sections endpoint. */
  caption?: string | null;
}

interface ThumbnailProps {
  src: string;
  index: number;
  isActive: boolean;
  sizes: string;
  className: string;
  onSelect: (index: number) => void;
}

function Thumbnail({ src, index, isActive, sizes, className, onSelect }: ThumbnailProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      aria-label={`Show screenshot ${index + 1}`}
      aria-current={isActive}
      className={cn(
        "relative overflow-hidden rounded border-2 transition-colors",
        isActive ? "border-secondary-500" : "border-transparent",
        className,
      )}
    >
      {isRenderableImageSrc(src) ? (
        <SafeImage src={src} alt="" fill sizes={sizes} className="object-cover" />
      ) : null}
    </button>
  );
}

export function CourseScreenshots({ screenshots, caption }: CourseScreenshotsProps) {
  const allSources = screenshots.filter(Boolean);
  const [index, setIndex] = useState(0);

  if (!allSources.length) return null;

  const hasMultiple = allSources.length > 1;

  return (
    <section className="space-y-8">
      <h2 className="font-suse text-[32px] leading-[1.2] font-medium text-neutral-900">
        Sneak Peek
      </h2>

      <div className="flex gap-6">
        {hasMultiple && (
          <div className="hidden h-132 w-49 shrink-0 flex-col gap-2 lg:flex">
            {allSources.map((src, i) => (
              <Thumbnail
                key={i}
                src={src}
                index={i}
                isActive={i === index}
                sizes="196px"
                className="min-h-px w-full flex-1"
                onSelect={setIndex}
              />
            ))}
          </div>
        )}

        <div className="relative aspect-video w-full overflow-hidden rounded lg:h-132 lg:flex-1">
          {caption && index === 0 ? (
            <div className="absolute inset-x-0 bottom-48 z-10 px-6">
              <p className="font-suse text-xl font-bold text-neutral-900">{caption}</p>
            </div>
          ) : null}
          {isRenderableImageSrc(allSources[index]) ? (
            <SafeImage
              src={allSources[index]}
              alt={`Screenshot ${index + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 746px"
              className="object-cover"
            />
          ) : null}
        </div>
      </div>

      {/* The desktop rail is hidden below lg — without this strip small screens
          can only ever see the first screenshot. */}
      {hasMultiple && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
          {allSources.map((src, i) => (
            <Thumbnail
              key={i}
              src={src}
              index={i}
              isActive={i === index}
              sizes="112px"
              className="h-16 w-28 shrink-0"
              onSelect={setIndex}
            />
          ))}
        </div>
      )}
    </section>
  );
}
