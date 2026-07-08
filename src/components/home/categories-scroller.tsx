"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import type { CourseCategory } from "@/types/course";

const FALLBACK_CATEGORIES: Pick<CourseCategory, "name" | "slug">[] = [
  { name: "Discount courses", slug: "discount-courses" },
  { name: "Online courses", slug: "online-courses" },
  { name: "On Demand courses", slug: "on-demand-courses" },
  { name: "Accounting courses", slug: "accounting-courses" },
  { name: "IT courses", slug: "it-courses" },
  { name: "Health & Safety courses", slug: "health-safety" },
  { name: "Food Hygiene courses", slug: "food-hygiene" },
  { name: "Safeguarding courses", slug: "safeguarding" },
];

export function CategoriesScroller({ categories }: { categories?: CourseCategory[] }) {
  const items =
    categories && categories.length > 0
      ? categories.map((c) => ({ name: c.name, slug: c.slug }))
      : FALLBACK_CATEGORIES;

  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  function scrollBy(px: number) {
    trackRef.current?.scrollBy({ left: px, behavior: "smooth" });
  }

  return (
    <div
      className="group relative flex items-center gap-1 px-4 pb-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Left arrow */}
      <button
        type="button"
        onClick={() => scrollBy(-200)}
        aria-label="Scroll categories left"
        className="z-10 shrink-0 rounded p-0.5 text-white/60 opacity-0 transition-all group-hover:opacity-100 hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Scrollable track with auto-scroll illusion via marquee when not hovered */}
      <div className="relative min-w-0 flex-1 overflow-hidden mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        {/* Auto-scroll strip — hidden when hovered */}
        <div
          style={{ animationDuration: "80s" }}
          className={`flex w-max items-center gap-0 transition-opacity duration-200 ${paused ? "pointer-events-none absolute opacity-0" : "animate-infinite-scroll"}`}
          aria-hidden={paused}
        >
          {[...items, ...items].map((cat, i) => (
            <Item key={`auto-${cat.slug}-${i}`} name={cat.name} slug={cat.slug} />
          ))}
        </div>

        {/* Manual scroll track — shown when hovered */}
        <div
          ref={trackRef}
          className={`flex scrollbar-none items-center gap-0 overflow-x-auto transition-opacity duration-200 [&::-webkit-scrollbar]:hidden ${paused ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`}
          aria-hidden={!paused}
        >
          {items.map((cat, i) => (
            <Item key={`manual-${cat.slug}-${i}`} name={cat.name} slug={cat.slug} />
          ))}
        </div>
      </div>

      {/* Right arrow */}
      <button
        type="button"
        onClick={() => scrollBy(200)}
        aria-label="Scroll categories right"
        className="z-10 shrink-0 rounded p-0.5 text-white/60 opacity-0 transition-all group-hover:opacity-100 hover:text-white"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Item({ name, slug }: { name: string; slug: string }) {
  return (
    <span className="ml-2 flex shrink-0 items-center gap-6">
      <Link
        href={`/course-cat/${slug}`}
        className="font-open-sans text-base leading-normal font-normal whitespace-nowrap text-white transition-colors hover:text-white/80"
      >
        {name}
      </Link>
      <span className="h-4 w-px shrink-0 bg-white/40" aria-hidden="true" />
    </span>
  );
}
