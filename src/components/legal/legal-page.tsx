import Link from "next/link";
import { ParsedHtml } from "@/components/ui/parsed-html";
import type { WpPageContent } from "@/lib/services/pages.server";

interface LegalPageProps {
  eyebrow: string;
  /** Fallbacks when the WP page is missing. */
  defaultTitle: string;
  defaultIntro: string;
  page: WpPageContent | null;
}

/** Shared layout for WP-managed legal pages (Terms, Privacy). */
export function LegalPage({ eyebrow, defaultTitle, defaultIntro, page }: LegalPageProps) {
  return (
    <>
      <section className="bg-primary-50 py-14 text-center">
        <div className="container">
          <p className="font-open-sans text-sm font-semibold uppercase tracking-wide text-secondary-500">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-suse text-4xl font-bold text-neutral-900">
            {page?.title ?? defaultTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl font-open-sans text-neutral-500">{defaultIntro}</p>
        </div>
      </section>

      <section className="py-14">
        <div className="container max-w-3xl">
          {page?.content ? (
            <ParsedHtml
              as="div"
              className="prose-wp font-open-sans text-neutral-700"
              content={page.content}
            />
          ) : (
            <p className="font-open-sans text-neutral-500">
              This page is being updated. Please check back soon or{" "}
              <Link href="/contact" className="font-semibold text-secondary-500 underline">
                contact us
              </Link>{" "}
              if you need this information right away.
            </p>
          )}
          {page?.modified && (
            <p className="mt-10 font-open-sans text-xs text-neutral-400">
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
