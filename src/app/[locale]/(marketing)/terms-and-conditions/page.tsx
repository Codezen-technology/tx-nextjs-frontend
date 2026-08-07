import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { wpPath } from "@/lib/seo/wp-paths";
import { env } from "@/lib/env";
import { fetchWpPage } from "@/lib/services/pages.server";
import { LegalPage } from "@/components/legal/legal-page";

const TERMS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Terms & Conditions | Training Excellence",
  description: "The terms of use for Training Excellence online training platform.",
};

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo(wpPath.page("terms-and-conditions"));
  return buildPageMetadata(seo, {
    title: "Terms & Conditions",
    description:
      "The terms of use that apply when you browse Training Excellence, purchase a course, or use our online training platform.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/terms-and-conditions`,
  });
}

export const revalidate = 3600;

export default async function TermsPage() {
  const page = await fetchWpPage(["terms-and-conditions", "terms-of-service", "terms", "policies"]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(TERMS_SCHEMA) }}
      />
      <LegalPage
        eyebrow="Terms of use"
        defaultTitle="Terms & Conditions"
        defaultIntro="The terms that apply when you use our website, purchase a course, or train with us."
        page={page}
      />
    </>
  );
}
