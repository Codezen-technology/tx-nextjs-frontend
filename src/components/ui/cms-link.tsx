import Link from "next/link";
import type { ReactNode } from "react";
import { isExternalUrl } from "@/lib/utils/url";

/**
 * A CMS-authored destination rendered as `next/link` for our own origin and a
 * new-tab anchor for anywhere else — the split the URL helpers document.
 *
 * The service layer has already run the href through `safeCmsHref`, so a
 * WP-origin URL arrived here as a path and a remaining absolute URL really is
 * somewhere else. Used by every surface an editor can point at: the floating
 * bar's CTA, the certificate promo banner, and whatever comes next.
 */
export function CmsLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  if (isExternalUrl(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
