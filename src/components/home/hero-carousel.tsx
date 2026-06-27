"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CourseCard } from "@/components/courses/course-card";
import type { Course } from "@/types/course";

interface HeroCarouselProps {
  courses: Course[];
}

// Positions from Figma node 89:10324 (relative to leftmost card as origin):
//   behind-left x=0   y=+20  scale=0.905  z=20  (peeks from left)
//   FRONT       x=177 y=0    scale=1.0    z=40  (hero card, full shadow)
//   right-1     x=383 y=+20  scale=0.905  z=30
//   far-right   x=560 y=+44  scale=0.797  z=10
const CARD_OFFSETS = [
  { x: 0, y: 20, scale: 0.905, z: 20, shadow: "" },
  {
    x: 177,
    y: 0,
    scale: 1.0,
    z: 40,
    shadow: "[filter:drop-shadow(0px_16px_48px_rgba(0,0,0,0.18))]",
  },
  { x: 383, y: 20, scale: 0.905, z: 30, shadow: "" },
  { x: 560, y: 44, scale: 0.797, z: 10, shadow: "" },
] as const;

export function HeroCarousel({ courses }: HeroCarouselProps) {
  const [active, setActive] = useState(0);
  const total = courses.length;

  if (total === 0) return null;

  const prev = () => setActive((a) => (a - 1 + total) % total);
  const next = () => setActive((a) => (a + 1) % total);

  // active course sits at FRONT (index 1 of CARD_OFFSETS)
  // ordered[0] = active-1  → behind-left
  // ordered[1] = active    → FRONT
  // ordered[2] = active+1  → right
  // ordered[3] = active+2  → far-right
  const count = Math.min(total, 4);
  const ordered = Array.from(
    { length: count },
    (_, j) => courses[(active - 1 + j + total) % total],
  );

  return (
    <div className="relative hidden lg:flex lg:flex-1 lg:flex-col">
      {/* Stacked cards — anchored at behind-left card origin */}
      <div className="relative h-[500px] w-full overflow-visible">
        {ordered.map((course, idx) => {
          const offset = CARD_OFFSETS[idx];
          if (!offset) return null;
          return (
            <div
              key={course.id}
              className={cn("absolute w-[306px] transition-all duration-500", offset.shadow)}
              style={{
                transform: `translateX(${offset.x}px) translateY(${offset.y}px) scale(${offset.scale})`,
                zIndex: offset.z,
                transformOrigin: "top left",
              }}
            >
              <CourseCard course={course} />
            </div>
          );
        })}
      </div>

      {/* Navigation — aligned below the FRONT card centre (front starts at x=177, width=306 → centre=330) */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={prev}
          aria-label="Previous course"
          className="text-[#3b5374] transition-colors hover:text-[#00204a]"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-200",
                i === active
                  ? "scale-125 bg-black"
                  : "border border-[#3B5374] bg-transparent hover:bg-black",
              )}
            />
          ))}
        </div>
        <button
          onClick={next}
          aria-label="Next course"
          className="text-[#3b5374] transition-colors hover:text-[#00204a]"
        >
          <ArrowRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
