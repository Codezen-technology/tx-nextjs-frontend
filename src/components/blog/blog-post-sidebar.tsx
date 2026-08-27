"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import type { TocItem } from "@/lib/utils/toc";

interface BlogPostSidebarProps {
  toc: TocItem[];
}

/** Clearance for the sticky header so the target heading is not scrolled under it. */
const SCROLL_OFFSET_PX = 96;

export function BlogPostSidebar({ toc }: BlogPostSidebarProps) {
  const [activeId, setActiveId] = useState<string>("");

  /**
   * The native `#id` jump lands the heading flush with the viewport top, i.e.
   * behind the sticky header, which reads as "the link did nothing". Scroll
   * explicitly with clearance instead, and only fall through to the browser if
   * the target is genuinely missing.
   */
  const handleJump = useCallback((e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    setActiveId(id);

    // Keep the URL shareable and the heading focusable without a second jump.
    window.history.replaceState(null, "", `#${id}`);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!toc.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-10% 0px -75% 0px" },
    );

    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  if (!toc.length) return null;

  return (
    <aside className="border-neutral-30 overflow-hidden rounded-lg border bg-white">
      <div className="border-neutral-40 bg-neutral-30 border-b p-4">
        <p className="font-suse text-xl leading-[1.2] font-bold text-neutral-900">
          Table of Contents
        </p>
      </div>
      <nav aria-label="Table of contents" className="flex flex-col gap-1 pb-2">
        {toc.map(({ id, text }, i) => {
          const active = activeId === id;
          return (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => handleJump(e, id)}
              data-toc-link={id}
              aria-current={active ? "location" : undefined}
              className={`font-open-sans flex items-start gap-2 border-l-[3px] px-4 py-2.5 text-base leading-normal transition-colors ${
                active
                  ? "border-secondary-500 bg-secondary-50 text-secondary-500 font-semibold"
                  : "hover:text-secondary-500 border-transparent text-neutral-500"
              }`}
            >
              <span className="font-suse shrink-0 font-semibold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">{text}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
