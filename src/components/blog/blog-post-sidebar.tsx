"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { TocItem } from "@/lib/utils/toc";

interface Contributor {
  name?: string;
  description?: string;
  avatar_urls?: Record<string, string>;
}

interface BlogPostSidebarProps {
  toc: TocItem[];
  contributors: Contributor[];
}

export function BlogPostSidebar({ toc, contributors }: BlogPostSidebarProps) {
  const [activeId, setActiveId] = useState<string>("");

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

  return (
    <aside className="space-y-8">
      {toc.length > 0 && (
        <div>
          <p className="mb-4 font-open-sans text-sm font-semibold text-secondary-500">
            Table of Contents
          </p>
          <nav aria-label="Table of contents">
            <ul className="space-y-2.5">
              {toc.map(({ id, text }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={`block font-open-sans text-sm leading-snug transition-colors ${
                      activeId === id
                        ? "font-semibold text-secondary-500"
                        : "text-[#00204a] hover:text-secondary-500"
                    }`}
                  >
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {toc.length > 0 && contributors.length > 0 && <div className="border-t border-[#ebedf1]" />}

      {contributors.length > 0 && (
        <div>
          <p className="mb-4 font-open-sans text-sm font-semibold text-secondary-500">
            Contributors
          </p>
          <ul className="space-y-4">
            {contributors.map((c, i) => {
              const avatar = c.avatar_urls?.["96"] ?? c.avatar_urls?.["48"];
              const role = c.description?.trim().slice(0, 80) || "";
              return (
                <li key={i} className="flex items-center gap-3">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={c.name ?? ""}
                      width={48}
                      height={48}
                      className="shrink-0 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 font-suse text-lg font-bold text-primary-500">
                      {c.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-open-sans text-sm font-semibold text-[#00204a]">{c.name}</p>
                    {role && (
                      <p className="truncate font-open-sans text-xs text-neutral-500">{role}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
}
