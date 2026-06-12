import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PageLinksProps {
  page: number;
  totalPages: number;
  /** Builds the href for a given page number. */
  hrefFor: (page: number) => string;
  className?: string;
}

/** Link-based pagination for server-rendered listing pages. */
export function PageLinks({ page, totalPages, hrefFor, className }: PageLinksProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2,
  );

  const items: Array<number | "…"> = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) items.push("…");
    items.push(p);
  });

  return (
    <nav
      aria-label="Pagination"
      className={cn("mt-12 flex items-center justify-center gap-2", className)}
    >
      {page > 1 && (
        <Link
          href={hrefFor(page - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-[#ebedf1] text-neutral-500 hover:bg-primary-50"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {items.map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-neutral-400">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md border font-open-sans text-sm",
              item === page
                ? "border-secondary-500 bg-secondary-500 font-semibold text-white"
                : "border-[#ebedf1] text-neutral-600 hover:bg-primary-50",
            )}
          >
            {item}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link
          href={hrefFor(page + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-[#ebedf1] text-neutral-500 hover:bg-primary-50"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
