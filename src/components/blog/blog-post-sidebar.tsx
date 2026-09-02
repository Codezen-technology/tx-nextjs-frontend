"use client";

import type { MouseEvent } from "react";
import { useToc } from "./use-toc";
import type { TocItem } from "@/lib/utils/toc";

interface BlogPostSidebarProps {
  toc: TocItem[];
}

interface TocListProps {
  toc: TocItem[];
  activeId: string;
  onJump: (e: MouseEvent<HTMLAnchorElement>, id: string) => void;
  /** Which of the two ToC surfaces this list belongs to. Both render the same
      links, so tests and queries need a way to address one and not the other. */
  surface: "rail" | "drawer";
}

/** The numbered list itself — shared by the desktop rail and the mobile drawer. */
export function TocList({ toc, activeId, onJump, surface }: TocListProps) {
  return (
    <nav
      aria-label="Table of contents"
      data-toc-surface={surface}
      className="flex flex-col gap-1 pb-2"
    >
      {toc.map(({ id, text }, i) => {
        const active = activeId === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => onJump(e, id)}
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
  );
}

/**
 * Desktop Table-of-Contents rail. Below `lg` this renders nothing — the mobile
 * surface is `BlogTocDrawer`, which the page mounts outside the article grid so
 * an empty grid cell does not leave a 40px gap behind it (QA-BLOGS-D1).
 */
export function BlogPostSidebar({ toc }: BlogPostSidebarProps) {
  const { activeId, jumpTo } = useToc(toc);

  const handleJump = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (jumpTo(id)) e.preventDefault();
  };

  if (!toc.length) return null;

  return (
    <aside className="border-neutral-30 overflow-hidden rounded-lg border bg-white">
      <div className="border-neutral-40 bg-neutral-30 border-b p-4">
        <p className="font-suse text-xl leading-[1.2] font-bold text-neutral-900">
          Table of Contents
        </p>
      </div>
      <TocList toc={toc} activeId={activeId} onJump={handleJump} surface="rail" />
    </aside>
  );
}
