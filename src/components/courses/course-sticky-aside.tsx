"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Matches the sticky container's `top-24` (6rem) offset. */
const STICKY_TOP_PX = 96;

interface CourseStickyAsideProps {
  /** Course feature image — visible at rest, collapsed once the card sticks. */
  image: ReactNode;
  /** The purchase card, which stays visible at every scroll position. */
  children: ReactNode;
}

/**
 * Desktop sticky column for the course page. The feature image is part of the
 * hero composition, so it collapses away the moment the column becomes stuck —
 * otherwise it rides down the page and pushes the purchase card's CTA below the
 * fold on shorter viewports.
 *
 * A zero-height sentinel above the sticky container reports the stuck state:
 * with the observer root inset by the sticky offset, the sentinel stops
 * intersecting exactly when the container pins.
 */
export function CourseStickyAside({ image, children }: CourseStickyAsideProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) => setIsStuck(!entry.isIntersecting), {
      rootMargin: `-${STICKY_TOP_PX}px 0px 0px 0px`,
      threshold: 0,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="pointer-events-none -mb-px h-px" />
      <div className="sticky top-24 z-20">
        <div
          data-testid="course-feature-image"
          // grid-rows 0fr → 1fr collapses an auto-height child without hardcoding a height.
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
            isStuck ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
          )}
          aria-hidden={isStuck}
        >
          <div className="overflow-hidden">{image}</div>
        </div>
        {children}
      </div>
    </>
  );
}
