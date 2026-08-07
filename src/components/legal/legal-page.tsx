import Link from "next/link";
import { ParsedHtml } from "@/components/ui/parsed-html";
import type { WpPageContent } from "@/lib/services/pages.server";

interface LegalPageProps {
  eyebrow: string;
  /** Fallbacks when the WP page is missing. */
  defaultTitle: string;
  defaultIntro: string;
  /** Baked-in HTML body rendered when the WP page has no content. */
  defaultContent?: string;
  page: WpPageContent | null;
}

/** Shared layout for WP-managed legal pages (Terms, Privacy). */
export function LegalPage({
  eyebrow,
  defaultTitle,
  defaultIntro,
  defaultContent,
  page,
}: LegalPageProps) {
  const bodyHtml = page?.content || defaultContent;

  return (
    <>
      <section className="bg-primary-50 py-14 text-center">
        <div className="container">
          <p className="font-open-sans text-secondary-500 text-sm font-semibold tracking-wide uppercase">
            {eyebrow}
          </p>
          <h1 className="font-suse mt-2 text-4xl font-bold text-neutral-900">
            {page?.title ?? defaultTitle}
          </h1>
          <p className="font-open-sans mx-auto mt-3 max-w-2xl text-neutral-500">{defaultIntro}</p>
        </div>
      </section>

      <section className="py-14">
        <div className="container max-w-3xl">
          {bodyHtml ? (
            <ParsedHtml
              as="div"
              className="prose-wp font-open-sans text-neutral-700"
              content={bodyHtml ?? ""}
            />
          ) : (
            <p className="font-open-sans text-neutral-500">
              This page is being updated. Please check back soon or{" "}
              <Link href="/contact-us" className="text-secondary-500 font-semibold underline">
                contact us
              </Link>{" "}
              if you need this information right away.
            </p>
          )}
          {page?.modified && (
            <p className="font-open-sans mt-10 text-xs text-neutral-400">
              Last updated:{" "}
              {new Date(page.modified).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
