import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { wpPath } from "@/lib/seo/wp-paths";
import { env } from "@/lib/env";
import { serverApi } from "@/lib/api/server";
import { getAboutPage } from "@/lib/services/about";
import { Topbar } from "@/components/home/topbar";
import { AboutBreadcrumb } from "@/components/about/about-breadcrumb";
import { AboutHero } from "@/components/about/about-hero";
import { AboutCommitmentSection } from "@/components/about/about-commitment-section";
import { AboutValuesGrid } from "@/components/about/about-values-grid";
import { AboutTeamSection } from "@/components/about/about-team-section";

export const revalidate = 300;

const ABOUT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Training Excellence",
  description:
    "Training Excellence delivers fully accredited, 100% online compliance training trusted by learners and leading organisations across the UK.",
};

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo(wpPath.page("about-us"));
  return buildPageMetadata(seo, {
    title: "About Us",
    description:
      "Training Excellence delivers fully accredited, 100% online compliance training trusted by learners and leading organisations across the UK.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/about-us`,
  });
}

export default async function AboutPage() {
  const [about, home] = await Promise.all([getAboutPage(), serverApi.home.get().catch(() => null)]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(ABOUT_SCHEMA) }}
      />

      <AboutBreadcrumb />
      <Topbar items={home?.topbar} />
      <AboutHero data={about.hero} />
      <AboutCommitmentSection data={about.commitment_section} />
      <AboutValuesGrid data={about.values} />
      <AboutTeamSection data={about.team} />
    </>
  );
}
