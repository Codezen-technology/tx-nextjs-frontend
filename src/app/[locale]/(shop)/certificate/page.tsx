import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata } from "@/lib/seo/server";
import { wpPath } from "@/lib/seo/wp-paths";
import { env } from "@/lib/env";
import {
  CertificatePageShell,
  type CertificatePageDefaults,
} from "@/components/certificate/certificate-page-shell";
import { certificateService } from "@/lib/services/certificate";

export const revalidate = 3600;

/** Static copy used per-field wherever the CMS has nothing configured. */
const DEFAULTS: CertificatePageDefaults = {
  heroHeading: "Power Your Professional Growth with CPD Certification & Transcript",
  benefits: [
    "Showcase Your Professional Growth",
    "Strengthen Your CV & Career Opportunities",
    "Meet CPD & Professional Requirements",
  ],
  orderHeading: "Order Your New Certificate",
  promoLabel: "Promotional Banner",
  heroImages: [
    {
      src: "/images/certificate/hero-certificate.jpg",
      alt: "Sample CPD accredited certificate",
      width: 306,
      height: 231,
    },
    {
      src: "/images/certificate/hero-transcript.jpg",
      alt: "Sample official transcript",
      width: 196,
      height: 260,
    },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo(wpPath.page("certificate"));
  return buildPageMetadata(seo, {
    title: "Order Your Certificate",
    description:
      "Order your official CPD-accredited certificate and transcript. Digital and printed copies available — showcase your professional growth.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/certificate`,
  });
}

export default async function CertificatePage() {
  setRequestLocale(await getLocale());

  const content = await certificateService.getPage("default").catch(() => null);

  return <CertificatePageShell product="default" content={content} defaults={DEFAULTS} />;
}
