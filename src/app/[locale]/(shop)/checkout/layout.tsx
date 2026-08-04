import type { Metadata } from "next";
import { MinimalShell } from "@/components/layout/minimal-shell";
/**
 * Transactional route with per-session content and no search value.
 * `robots.txt` blocks crawling; this blocks indexing. A disallowed-but-linked
 * URL can still surface in search results without it.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <MinimalShell>{children}</MinimalShell>;
}
