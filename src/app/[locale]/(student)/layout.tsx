import type { Metadata } from "next";

/**
 * Student area is behind auth — every URL here renders a login redirect to a crawler.
 * `robots.txt` blocks crawling; this blocks indexing. A disallowed-but-linked
 * URL can still surface in search results without it.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
