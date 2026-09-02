"use client";

import { useCallback, useEffect, useState } from "react";
import type { TocItem } from "@/lib/utils/toc";

/** Clearance for the sticky header so the target heading is not scrolled under it. */
export const SCROLL_OFFSET_PX = 96;

/**
 * Shared jump + active-heading tracking for the two Table-of-Contents surfaces:
 * the desktop rail (`BlogPostSidebar`) and the mobile drawer (`BlogTocDrawer`).
 * Both need the same offset scroll — the native `#id` jump lands the heading
 * behind the sticky header, which reads as "the link did nothing".
 */
export function useToc(toc: TocItem[]) {
  const [activeId, setActiveId] = useState<string>("");

  const jumpTo = useCallback((id: string): boolean => {
    const target = document.getElementById(id);
    if (!target) return false;

    const top = target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    setActiveId(id);

    // Keep the URL shareable and the heading focusable without a second jump.
    window.history.replaceState(null, "", `#${id}`);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    return true;
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

  return { activeId, jumpTo };
}
