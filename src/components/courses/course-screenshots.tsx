"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { isRenderableImageSrc } from "@/lib/utils/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CourseScreenshotsProps {
  screenshots: string[];
}

export function CourseScreenshots({ screenshots }: CourseScreenshotsProps) {
  const [index, setIndex] = useState(0);

  if (!screenshots.length) return null;

  const prev = () => setIndex((i) => (i - 1 + screenshots.length) % screenshots.length);
  const next = () => setIndex((i) => (i + 1) % screenshots.length);

  return (
    <section className="space-y-4">
      <h2 className="font-suse text-[32px] leading-[1.2] font-bold text-neutral-900 sm:text-[38px]">
        Course in action
      </h2>
      <div className="border-neutral-30 relative overflow-hidden rounded-xl border bg-neutral-100">
        <div className="relative aspect-video w-full">
          {isRenderableImageSrc(screenshots[index]) ? (
            <SafeImage
              src={screenshots[index]}
              alt={`Screenshot ${index + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              className="object-contain"
            />
          ) : null}
        </div>
        {screenshots.length > 1 ? (
          <>
            <button
              onClick={prev}
              aria-label="Previous screenshot"
              className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-sm transition-colors hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next screenshot"
              className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-sm transition-colors hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {screenshots.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to screenshot ${i + 1}`}
                  className={`h-2 w-2 rounded-full transition-colors ${i === index ? "bg-secondary-500" : "bg-neutral-300"}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
      {screenshots.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {screenshots.map((src, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded border-2 transition-colors ${i === index ? "border-secondary-500" : "border-transparent"}`}
            >
              {isRenderableImageSrc(src) ? (
                <SafeImage
                  src={src}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
