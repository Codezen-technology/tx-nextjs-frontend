"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ChevronUp, X } from "lucide-react";
import { TocList } from "./blog-post-sidebar";
import { useToc } from "./use-toc";
import type { TocItem } from "@/lib/utils/toc";

interface BlogTocDrawerProps {
  toc: TocItem[];
}

/**
 * QA-BLOGS-D1: at 440 the Table of Contents was laid out as one more section in
 * the article flow, so a reader had to scroll past the whole post to reach it.
 * The report asks for it to sit on the bottom edge of the screen and open as a
 * floating panel. Rendered outside the article grid and hidden from `lg` up,
 * where the desktop rail (`BlogPostSidebar`) takes over.
 */
export function BlogTocDrawer({ toc }: BlogTocDrawerProps) {
  const [open, setOpen] = useState(false);
  const { activeId, jumpTo } = useToc(toc);
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape closes, and the body does not scroll behind the open panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!toc.length) return null;

  const handleJump = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!jumpTo(id)) return;
    e.preventDefault();
    // Close first: the panel covers most of a 440 viewport, so leaving it open
    // would hide the heading the tap just scrolled to.
    setOpen(false);
  };

  const active = toc.find((t) => t.id === activeId);

  return (
    <div className="lg:hidden">
      {open && (
        <button
          type="button"
          aria-label="Close table of contents"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-neutral-900/40"
        />
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col justify-end px-3 pb-3">
        {open && (
          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Table of contents"
            className="border-neutral-30 pointer-events-auto mb-2 max-h-[55vh] overflow-y-auto rounded-xl border bg-white shadow-[0_-8px_24px_rgba(0,32,74,0.15)] outline-none"
          >
            <div className="border-neutral-40 bg-neutral-30 sticky top-0 flex items-center justify-between rounded-t-xl border-b p-4">
              <p className="font-suse text-xl leading-[1.2] font-bold text-neutral-900">
                Table of Contents
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close table of contents"
                className="hover:text-secondary-500 text-neutral-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <TocList toc={toc} activeId={activeId} onJump={handleJump} surface="drawer" />
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="border-neutral-30 pointer-events-auto flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,32,74,0.12)]"
        >
          <span className="min-w-0 text-left">
            <span className="font-suse block text-base font-bold text-neutral-900">
              Table of Contents
            </span>
            {/* Second line only once a heading is in view — before that it would
                just repeat the title above it. */}
            {active && (
              <span className="font-open-sans block truncate text-sm text-neutral-500">
                {active.text}
              </span>
            )}
          </span>
          <ChevronUp
            className={`h-5 w-5 shrink-0 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}
