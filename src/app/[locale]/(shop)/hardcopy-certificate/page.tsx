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

/**
 * Hardcopy-led certificate funnel — the printed certificate is the required
 * purchase and the digital transcript an optional add-on, the inverse of
 * `/certificate`. Both are the same Gravity Form fields with different choices,
 * so the ordering semantics come from the backend config, not from here.
 */

/** Static copy used per-field wherever the CMS has nothing configured. */
const DEFAULTS: CertificatePageDefaults = {
  heroHeading: "Order Hardcopy Certificate",
  heroText: "Power Your Professional Growth with CPD Certification & Transcript",
  benefits: [
    "Showcase Your Professional Growth",
    "Strengthen Your CV & Career Opportunities",
    "Meet CPD & Professional Requirements",
  ],
  orderHeading: "Order Your Hardcopy Certificate",
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
  const seo = await fetchRankMathSeo(wpPath.page("hardcopy-certificate"));
  return buildPageMetadata(seo, {
    title: "Order Hardcopy Certificate",
    description:
      "Order your officially printed CPD-accredited certificate and transcript, posted to you. UK and international delivery available.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/hardcopy-certificate`,
  });
}

export default async function HardcopyCertificatePage() {
  setRequestLocale(await getLocale());

  const content = await certificateService.getPage("hardcopy").catch(() => null);

  return <CertificatePageShell product="hardcopy" content={content} defaults={DEFAULTS} />;
}
