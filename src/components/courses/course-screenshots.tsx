"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { isRenderableImageSrc } from "@/lib/utils/image";
import { cn } from "@/lib/utils/cn";

interface CourseScreenshotsProps {
  screenshots: string[];
  title?: string;
  defaultImage?: string;
}

export function CourseScreenshots({ screenshots, title, defaultImage }: CourseScreenshotsProps) {
  const allSources = [defaultImage, ...screenshots].filter(Boolean) as string[];
  const [index, setIndex] = useState(0);

  return (
    <section className="space-y-8">
      <h2 className="font-suse text-[32px] leading-[1.2] font-medium text-neutral-900">
        Sneak Peek
      </h2>

      <div className="flex gap-6">
        {allSources.length > 1 && (
          <div className="hidden h-132 w-49 shrink-0 flex-col gap-2 lg:flex">
            {allSources.map((src, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={cn(
                  "relative min-h-px w-full flex-1 overflow-hidden rounded border-2 transition-colors",
                  i === index ? "border-secondary-500" : "border-transparent",
                )}
              >
                {isRenderableImageSrc(src) ? (
                  <SafeImage
                    src={src}
                    alt={`Thumbnail ${i + 1}`}
                    fill
                    sizes="196px"
                    className="object-cover"
                  />
                ) : null}
              </button>
            ))}
          </div>
        )}

        <div className="relative aspect-video w-full overflow-hidden rounded lg:h-132 lg:flex-1">
          {title && index === 0 ? (
            <div className="absolute inset-x-0 bottom-48 z-10 px-6">
              <h2 className="font-suse text-xl font-bold text-neutral-900">{title}</h2>
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
    </section>
  );
}
