"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

const POPULAR_CATEGORIES = [
  "Discount courses",
  "Online courses",
  "On Demand courses",
  "Accounting courses",
  "IT courses",
];

export function CategoriesScroller() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === "left" ? -160 : 160, behavior: "smooth" });
  };

  return (
    <div className="flex items-center gap-2 overflow-hidden px-6 pb-6">
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className="shrink-0 text-white transition-opacity hover:opacity-70"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        ref={scrollRef}
        className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {POPULAR_CATEGORIES.map((cat, i) => (
          <span key={cat} className="flex shrink-0 items-center gap-4">
            <Link
              href={`/courses?search=${encodeURIComponent(cat)}`}
              className="whitespace-nowrap font-open-sans text-base font-normal leading-[1.5] text-white transition-colors hover:text-white/80"
            >
              {cat}
            </Link>
            {i < POPULAR_CATEGORIES.length - 1 && (
              <span className="h-4 w-px shrink-0 bg-white/40" />
            )}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className="shrink-0 text-white transition-opacity hover:opacity-70"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
