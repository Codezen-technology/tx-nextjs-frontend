import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { fetchWpPage } from "@/lib/services/pages.server";
import { LegalPage } from "@/components/legal/legal-page";

const PRIVACY_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Privacy Policy | Training Excellence",
  description: "How Training Excellence collects, uses, and protects your personal information.",
};

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/privacy-policy");
  return buildPageMetadata(seo, {
    title: "Privacy Policy | Training Excellence",
    description:
      "How Training Excellence collects, uses, and protects your personal information when you use our website and courses.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/privacy-policy`,
  });
}

export const revalidate = 3600;

export default async function PrivacyPage() {
  const page = await fetchWpPage(["privacy-policy", "privacy"]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(PRIVACY_SCHEMA) }}
      />
      <LegalPage
        eyebrow="Privacy policy"
        defaultTitle="We care about your privacy"
        defaultIntro="Your privacy is important to us at Training Excellence. We respect your privacy regarding any information we may collect from you across our website."
        page={page}
      />
    </>
  );
}
