import type { Metadata } from "next";
import { MinimalHeader } from "@/components/layout/minimal-header";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
/**
 * Auth screens have no search value and must never be indexed.
 * `robots.txt` blocks crawling; this blocks indexing. A disallowed-but-linked
 * URL can still surface in search results without it.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-slate-50">
      <ImpersonationBanner />
      <MinimalHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-16">{children}</div>
    </div>
  );
}
