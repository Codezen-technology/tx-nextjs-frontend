import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
/**
 * Order receipts are per-customer and must never be indexed.
 * `robots.txt` blocks crawling; this blocks indexing. A disallowed-but-linked
 * URL can still surface in search results without it.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function OrderConfirmationLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
