import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { wpPath } from "@/lib/seo/wp-paths";
import { env } from "@/lib/env";
import { fetchWpPage } from "@/lib/services/pages.server";
import { LegalPage } from "@/components/legal/legal-page";
import {
  PRIVACY_POLICY_INTRO,
  PRIVACY_POLICY_CONTENT_HTML,
} from "@/components/legal/privacy-policy-content";

const PRIVACY_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Privacy Policy | Training Excellence",
  description: "How Training Excellence collects, uses, and protects your personal information.",
};

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo(wpPath.page("privacy-policy"));
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

  // The Elementor page embeds its own eyebrow/title/intro before the first
  // section (the site hero below already renders those) — drop everything up to
  // the first <h2> so the body is just the numbered sections, no duplicate title.
  const body =
    page?.content && /<h2\b/i.test(page.content)
      ? page.content.replace(/^[\s\S]*?(?=<h2\b)/i, "").trim()
      : page?.content;
  const legalPage = page ? { ...page, content: body ?? page.content } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(PRIVACY_SCHEMA) }}
      />
      <LegalPage
        eyebrow="Privacy policy"
        defaultTitle="Privacy Policy"
        defaultIntro={PRIVACY_POLICY_INTRO}
        defaultContent={PRIVACY_POLICY_CONTENT_HTML}
        page={legalPage}
      />
    </>
  );
}
